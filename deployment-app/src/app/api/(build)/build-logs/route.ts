import { NextRequest, NextResponse } from "next/server";
import { API, handleApiError } from "@/redux/api/util";
import { z } from "zod";
import { DescribeTasksCommand } from "@aws-sdk/client-ecs";
import { prisma } from "@/lib/prisma";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { ecsClient } from "@/lib/aws";
import { client } from "@/lib/clickhouse";

// Schema for build logs
export const BuildLogsSchema = z.object({
  event_id: z.string(),
  deployment_id: z.string(),
  log: z.string(),
  timestamp: z.string(),
});

type BuildLogs = z.infer<typeof BuildLogsSchema>;

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
        deploymentStatus: true
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
      deploymentStatus: deployment.deploymentStatus
    });
  } catch (error) {
    console.error("Failed to fetch build logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch build logs" },
      { status: 500 }
    );
  }
}

// Helper function to check if deployment is in a final state
function isDeploymentInFinalState(status: DeploymentStatus): boolean {
  const finalStates: DeploymentStatus[] = ['READY', 'FAILED'];
  return finalStates.includes(status);
}

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
        error: "Task not found" 
      };
    }

    const activeStates = ["PROVISIONING", "PENDING", "RUNNING", "DEPROVISIONING"];
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
      error: "Failed to check task status" 
    };
  }
}

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

async function updateStatus(deploymentId: string, status: DeploymentStatus) {
  try {
    await API.patch(`/deploy?deploymentId=${deploymentId}`, {
      deploymentStatus: status,
    });
  } catch (error) {
    console.error("Failed to update deployment status:", error);
    throw new Error("Failed to update deployment status");
  }
}