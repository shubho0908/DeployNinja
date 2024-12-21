const express = require("express");
const httpProxy = require("http-proxy");
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

// Load credentials from .env file
const envPath = path.resolve(process.cwd(), ".env");
const envConfig = dotenv.config({ path: envPath }).parsed || {};

const PORT = 8000;
const BASE_PATH =
  "https://deployment-app-build.s3.eu-north-1.amazonaws.com/__outputs";

// Create a proxy server
const proxy = httpProxy.createProxy();

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use((req, res) => {
  const hostname = req.hostname;
  const subDomain = hostname.split(".")[0]; // e.g. <subdomain>.shubho.dev
  console.log(subDomain);

  // This is the path where the request will be proxied to
  const resolvesTo = `${BASE_PATH}/${subDomain}`;

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
