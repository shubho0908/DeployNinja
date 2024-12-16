const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const dotenv = require("dotenv");

// Load AWS credentials from .env file
const envPath = path.resolve(process.cwd(), '.env');
const awsConfig = dotenv.config({ path: envPath }).parsed || {};

// Create S3 client with credentials from .env file
const s3Client = new S3Client({
  region: awsConfig.AWS_REGION,
  credentials: {
    accessKeyId: awsConfig.AWS_ACCESS_KEY_ID,
    secretAccessKey: awsConfig.AWS_SECRET_ACCESS_KEY,
  },
});

// Get project-related variables from process.env (Docker/ECS environment)
const PROJECT_ID = process.env.PROJECT_ID;
const PROJECT_INSTALL_COMMAND = process.env.PROJECT_INSTALL_COMMAND;
const PROJECT_BUILD_COMMAND = process.env.PROJECT_BUILD_COMMAND;
const PROJECT_ROOT_DIR = process.env.PROJECT_ROOT_DIR;
const S3_BUCKET_NAME = awsConfig.S3_BUCKET_NAME; // Get bucket name from .env

async function InitializeScript() {
  console.log("Executing script...");
  const outputDir = path.join(__dirname, "output");

  // Filter out PROJECT_ENVIRONMENT_ variables from process.env
  const projectEnvVars = Object.keys(process.env)
    .filter((key) => key.startsWith("PROJECT_ENVIRONMENT_"))
    .reduce((envVars, key) => {
      envVars[key] = process.env[key];
      return envVars;
    }, {});

  const buildProcess = exec(
    `cd ${outputDir} && ${PROJECT_INSTALL_COMMAND} && ${PROJECT_BUILD_COMMAND}`,
    {
      cwd: PROJECT_ROOT_DIR,
      env: {
        ...process.env,
        ...projectEnvVars,
      }
    }
  );

  buildProcess.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  buildProcess.stderr.on("data", (data) => {
    console.error("Error:", data.toString());
  });

  buildProcess.on("close", async () => {
    console.log(`Build complete`);
    const distDir = path.join(outputDir, "dist");
    const distFiles = fs.readdirSync(distDir, { recursive: true });

    for (const file of distFiles) {
      const filePath = path.join(distDir, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log(`Uploading ${filePath}...`);
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });
      await s3Client.send(command);
    }
    console.log("Upload complete...");
  });
}

InitializeScript();