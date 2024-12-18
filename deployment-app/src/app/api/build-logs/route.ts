import { createClient } from "@clickhouse/client";
import { NextRequest, NextResponse } from "next/server";

// Clickhouse client
export const client = createClient({
  database: process.env.CLICKHOUSE_DB!,
  url: process.env.CLICKHOUSE_HOST!,
});

// GET route to get all build logs of a deployment
export async function GET(req: NextRequest) {
  try {
    const deploymentId = req.nextUrl.searchParams.get("deploymentId");
    const logs = await client.query({
      query: `SELECT event_id, deployment_id, log, timestamp from log_events where deployment_id = {deployment_id:String}`,
      query_params: {
        deployment_id: deploymentId,
      },
      format: "JSONEachRow",
    });

    const rawLogs = await logs.json();
    return NextResponse.json({ status: 200, logs: rawLogs });
  } catch (error) {
    console.log("Something wrong happened in consumer");

    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
