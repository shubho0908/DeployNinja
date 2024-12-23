import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@clickhouse/client";
import { API, handleApiError } from "@/redux/api/util";
import { z } from "zod";

// Initialize Clickhouse client
const client = createClient({
  database: process.env.CLICKHOUSE_DB!,
  url: process.env.CLICKHOUSE_HOST!,
});

// Schema for build logs
const BuildLogsSchema = z.object({
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

// Update deployment status based on logs
async function updateDeploymentStatus(deploymentId: string, logs: BuildLogs[]) {
  const hasUploadComplete = logs.some((log) =>
    log.log.includes("Upload complete...")
  );
  const hasError = logs.some((log) => /error/i.test(log.log));

  if (hasUploadComplete) {
    await API.patch(`/deploy?deploymentId=${deploymentId}`, {
      deploymentStatus: "READY",
    });
  }

  if (hasError) {
    await API.patch(`/deploy?deploymentId=${deploymentId}`, {
      deploymentStatus: "FAILED",
    });
  }
}
