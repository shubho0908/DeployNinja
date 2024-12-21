import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@clickhouse/client";
import { API, handleApiError } from "@/redux/api/util";
import { z } from "zod";

// Clickhouse client
export const client = createClient({
  database: process.env.CLICKHOUSE_DB!,
  url: process.env.CLICKHOUSE_HOST!,
});

const BuildLogsSchema = z.object({
  event_id: z.string(),
  deployment_id: z.string(),
  log: z.string(),
  timestamp: z.string(),
});

type BuildLogs = z.infer<typeof BuildLogsSchema>;

// GET route to get all build logs of a deployment
export async function GET(req: NextRequest) {
  try {
    const deploymentId = req.nextUrl.searchParams.get("deploymentId");
    if (!deploymentId) {
      throw new Error(await handleApiError("Deployment ID is required"));
    }

    const logs = await client.query({
      query:
        "SELECT event_id, deployment_id, log, timestamp from log_events WHERE deployment_id = {deployment_id:String}",
      query_params: { deployment_id: deploymentId },
      format: "JSONEachRow",
    });

    const rawLogs = (await logs.json()) as BuildLogs[];

    const hasUploadComplete = rawLogs.some((log: BuildLogs) =>
      log.log.includes("Upload complete...")
    );
    const hasError = rawLogs.some((log: BuildLogs) =>
      /error/i.test(log.log)
    );

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

    return NextResponse.json({ status: 200, logs: rawLogs });
  } catch (error) {
    console.error("Failed to fetch build logs:", error);

    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

