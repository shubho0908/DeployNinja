const express = require("express");
const httpProxy = require("http-proxy");
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const axios = require("axios");

const envPath = path.resolve(process.cwd(), ".env");
const envConfig = dotenv.config({ path: envPath }).parsed || {};

const PORT = 8000;
const BASE_PATH = envConfig.BASE_PATH;

const proxy = httpProxy.createProxy();

app.use(cors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use(async (req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split(".")[0];
  const angularPath = `${BASE_PATH}/${subdomain}/angular/browser/index.html`;
  
  try {
    const response = await axios.head(angularPath);
    const resolvesTo = response.status === 200 
      ? `${BASE_PATH}/${subdomain}/angular/browser`
      : `${BASE_PATH}/${subdomain}`;

    return proxy.web(req, res, {
      target: resolvesTo,
      changeOrigin: true
    });
  } catch (error) {
    return proxy.web(req, res, {
      target: `${BASE_PATH}/${subdomain}`,
      changeOrigin: true
    });
  }
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  if (req.url === "/") {
    proxyReq.path += "index.html";
  }
});

app.listen(PORT, () => {
  console.log(`Reverse proxy server is running on port ${PORT}`);
});