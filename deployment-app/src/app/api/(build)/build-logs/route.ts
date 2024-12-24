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

// Fetch and process build logs
export async function GET(req: NextRequest) {
  const deploymentId = req.nextUrl.searchParams.get("deploymentId");

  if (!deploymentId) {
    throw new Error(await handleApiError("Deployment ID is required"));
  }

  try {
    const rawLogs = await fetchLogs(deploymentId);
    await updateDeploymentStatus(deploymentId, rawLogs);
    return NextResponse.json({ status: 200, logs: rawLogs });
  } catch (error) {
    console.error("Failed to fetch build logs:", error);
    throw new Error(await handleApiError(error));
  }
}

// Fetch logs from the database
async function fetchLogs(deploymentId: string): Promise<BuildLogs[]> {
  const logs = await client.query({
    query:
      "SELECT event_id, deployment_id, log, timestamp FROM log_events WHERE deployment_id = {deployment_id:String}",
    query_params: { deployment_id: deploymentId },
    format: "JSONEachRow",
  });
  return logs.json();
}

// Check ECS task status
async function checkECSTaskStatus(taskArn: string): Promise<{
  isActive: boolean;
  isSuccessful: boolean;
}> {
  try {
    const command = new DescribeTasksCommand({
      tasks: [taskArn],
      cluster: process.env.CLUSTER,
    });

    const response = await ecsClient.send(command);
    const task = response.tasks?.[0];

    if (!task) {
      console.log("No task found for ARN");
      return { isActive: false, isSuccessful: false };
    }

    // console.log(task);

    // Consider both PENDING and RUNNING as active states
    const isActive = [
      "PROVISIONING",
      "PENDING",
      "RUNNING",
      "DEPROVISIONING",
    ].includes(task.lastStatus || "");

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
    throw error;
  }
}

// Update deployment status based on logs and ECS task status
async function updateDeploymentStatus(deploymentId: string, logs: BuildLogs[]) {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    select: { taskArn: true },
  });

  const taskArn = deployment?.taskArn;
  let newStatus: DeploymentStatus = "IN_PROGRESS";

  if (taskArn) {
    const { isActive, isSuccessful } = await checkECSTaskStatus(taskArn);

    if (isActive) {
      // Task is either pending or running
      newStatus = "IN_PROGRESS";
      console.log("Task is active (pending or running)");
    } else {
      // Task is not active, check if it completed successfully
      if (isSuccessful) {
        console.log("Task completed successfully");
        const hasUploadComplete = logs.some((log) =>
          log.log.includes("Upload complete...")
        );
        newStatus = hasUploadComplete ? "READY" : "FAILED";
      } else {
        console.log("Task failed");
        newStatus = "FAILED";
      }
    }
  } else {
    console.log("No task ARN found for deployment");
    newStatus = "FAILED";
  }

  // Update deployment status
  await API.patch(`/deploy?deploymentId=${deploymentId}`, {
    deploymentStatus: newStatus,
  });
}
