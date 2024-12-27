import { createClient } from "@clickhouse/client";

export const client = createClient({
  database: process.env.CLICKHOUSE_DB!,
  url: process.env.CLICKHOUSE_HOST!,
});