import { NextRequest, NextResponse } from "next/server";
import { API } from "@/redux/api/util";
import { z } from "zod";
import { DescribeTasksCommand } from "@aws-sdk/client-ecs";
import { prisma } from "@/lib/prisma";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { ecsClient } from "@/lib/aws";
import { client } from "@/lib/clickhouse";
import { auth } from "@/auth";

// Schema for build logs
export const BuildLogsSchema = z.object({
  event_id: z.string(),
  deployment_id: z.string(),
  log: z.string(),
  timestamp: z.string(),
});

type BuildLogs = z.infer<typeof BuildLogsSchema>;

/**
 * @description Fetches build logs for a given deployment ID.
 * @param {NextRequest} req
 * @returns {NextResponse} JSON response containing the build logs and the current deployment status.
 * @throws {Error} If the deployment ID is not provided, or if there is an error fetching the build logs.
 */
export async function GET(req: NextRequest) {
  const deploymentId = req.nextUrl.searchParams.get("deploymentId");

  if (!deploymentId) {
    return NextResponse.json(
      { error: "Deployment ID is required" },
      { status: 400 }
    );
  }

  try {
    // First, get the current deployment status
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: {
        taskArn: true,
        deploymentStatus: true,
      },
    });

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    const rawLogs = await fetchLogs(deploymentId);

    // Only check ECS status if deployment is not in a final state
    if (!isDeploymentInFinalState(deployment.deploymentStatus)) {
      await updateDeploymentStatus(deploymentId, deployment.taskArn, rawLogs);
    }

    return NextResponse.json({
      status: 200,
      logs: rawLogs,
      deploymentStatus: deployment.deploymentStatus,
    });
  } catch (error) {
    console.error("Failed to fetch build logs:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch build logs",
      },
      { status: 500 }
    );
  }
}

// Helper function to check if deployment is in a final state
function isDeploymentInFinalState(status: DeploymentStatus): boolean {
  const finalStates: DeploymentStatus[] = ["READY", "FAILED"];
  return finalStates.includes(status);
}

/**
 * Fetches the build logs for a given deployment ID from ClickHouse.
 * @param {string} deploymentId The ID of the deployment to fetch logs for.
 * @returns {Promise<BuildLogs[]>} A promise resolving to an array of build logs.
 * @throws {Error} If there is an error fetching the logs.
 */
async function fetchLogs(deploymentId: string): Promise<BuildLogs[]> {
  try {
    const logs = await client.query({
      query:
        "SELECT event_id, deployment_id, log, timestamp FROM log_events WHERE deployment_id = {deployment_id:String} ORDER BY timestamp ASC",
      query_params: { deployment_id: deploymentId },
      format: "JSONEachRow",
    });
    return logs.json();
  } catch (error) {
    console.error("Error fetching logs from ClickHouse:", error);
    throw new Error("Failed to fetch deployment logs");
  }
}

/**
 * Checks the status of an ECS task.
 * @param {string} taskArn The ARN of the task to check.
 * @returns {Promise<{isActive: boolean, isSuccessful: boolean, error?: string}>} A promise resolving to an object with properties describing the task status.
 * - isActive: Whether the task is currently running or in a transitional state.
 * - isSuccessful: Whether the task completed successfully.
 * - error?: An optional string describing an error that occurred during the check.
 * @throws {Error} If there is an error checking the task status.
 */
async function checkECSTaskStatus(taskArn: string): Promise<{
  isActive: boolean;
  isSuccessful: boolean;
  error?: string;
}> {
  try {
    const command = new DescribeTasksCommand({
      tasks: [taskArn],
      cluster: process.env.CLUSTER,
    });

    const response = await ecsClient.send(command);
    const task = response.tasks?.[0];

    if (!task) {
      return {
        isActive: false,
        isSuccessful: false,
        error: "Task not found",
      };
    }

    const activeStates = [
      "PROVISIONING",
      "PENDING",
      "RUNNING",
      "DEPROVISIONING",
    ];
    const isActive = activeStates.includes(task.lastStatus || "");

    // Check for successful completion
    const isSuccessful =
      task.lastStatus === "STOPPED" &&
      task.stopCode === "EssentialContainerExited" &&
      task.containers?.[0]?.exitCode === 0;

    console.log(
      `Task status: ${task.lastStatus}, Active: ${isActive}, Successful: ${isSuccessful}`
    );

    return { isActive, isSuccessful };
  } catch (error) {
    console.error("Error checking ECS task status:", error);
    return {
      isActive: false,
      isSuccessful: false,
      error: "Failed to check task status",
    };
  }
}

/**
 * Updates deployment status based on ECS task status and logs.
 * If task is not found, or ECS task status check fails, deployment status is set to "FAILED".
 * If ECS task is inactive and logs show completion, deployment status is set to "READY".
 * If ECS task is active, deployment status is set to "IN_PROGRESS".
 * If ECS task is successful and logs show completion, deployment status is set to "READY".
 * @param {string} deploymentId - ID of the deployment to update
 * @param {string | null} taskArn - ARN of the ECS task to check
 * @param {BuildLogs[]} logs - Array of build logs
 */
async function updateDeploymentStatus(
  deploymentId: string,
  taskArn: string | null,
  logs: BuildLogs[]
) {
  if (!taskArn) {
    console.log("No task ARN found for deployment");
    await updateStatus(deploymentId, "FAILED");
    return;
  }

  const { isActive, isSuccessful, error } = await checkECSTaskStatus(taskArn);

  // If there's an error checking task status but deployment shows completion in logs,
  // don't mark it as failed
  const hasUploadComplete = logs.some((log) =>
    log.log.includes("Upload complete...")
  );

  let newStatus: DeploymentStatus;

  if (isActive) {
    newStatus = "IN_PROGRESS";
  } else if (error && hasUploadComplete) {
    // If task is not found but logs show completion, keep it as READY
    newStatus = "READY";
  } else if (isSuccessful && hasUploadComplete) {
    newStatus = "READY";
  } else {
    newStatus = "FAILED";
  }

  await updateStatus(deploymentId, newStatus);
}

/**
 * Updates the deployment status in the database by sending a PATCH request.
 * This function requires an authenticated session with a valid access token.
 * 
 * @param {string} deploymentId - The ID of the deployment to update.
 * @param {DeploymentStatus} status - The new status to set for the deployment.
 * @throws {Error} If authentication fails or if the update request fails.
 */

async function updateStatus(deploymentId: string, status: DeploymentStatus) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      throw new Error("Authentication required");
    }
    await API.patch(
      `/deploy?deploymentId=${deploymentId}`,
      {
        deploymentStatus: status,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          "X-Request-Maker": "webhook",
        },
      }
    );
  } catch (error) {
    console.error("Failed to update deployment status:", error);
    throw new Error("Failed to update deployment status");
  }
}
