const express = require("express");
const httpProxy = require("http-proxy");
const { createClient } = require("@clickhouse/client");
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const { randomUUID } = require("crypto");

// Load credentials from .env file
const envPath = path.resolve(process.cwd(), ".env");
const envConfig = dotenv.config({ path: envPath }).parsed || {};

const PORT = 8000;
const BASE_PATH =
  envConfig.BASE_PATH;

// Initialize ClickHouse client
const client = createClient({
  url: envConfig.CLICKHOUSE_HOST,
  username: envConfig.CLICKHOUSE_USER,
  password: envConfig.CLICKHOUSE_PASSWORD,
  database: envConfig.CLICKHOUSE_DB,
});

// Function to log visit to ClickHouse
async function logVisit(subdomain) {
  try {
    const event_id = randomUUID();
    await client.insert({
      table: "page_events",
      values: [
        {
          event_id,
          page_url: subdomain,
        },
      ],
      format: "JSONEachRow",
    });
    console.log("Visit logged successfully");
  } catch (error) {
    console.error("Error logging visit:", error);
  }
}

// Create a proxy server
const proxy = httpProxy.createProxy();

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use(async (req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split(".")[0]; // e.g. <subdomain>.shubho.dev
  console.log(subdomain);

  // Log the visit
  await logVisit(subdomain);

  // This is the path where the request will be proxied to
  const resolvesTo = `${BASE_PATH}/${subdomain}`;

  return proxy.web(req, res, {
    target: resolvesTo,
    changeOrigin: true,
  });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  const currentUrl = req.url;

  // If the request is for the root path, add index.html to the path
  if (currentUrl === "/") {
    proxyReq.path += "index.html";
  }
});

app.listen(PORT, () => {
  console.log(`Reverse proxy server is running on port ${PORT}`);
});
