const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const dotenv = require("dotenv");
const { Kafka, Partitioners } = require("kafkajs");
const { createClient } = require("@clickhouse/client");
const { randomUUID } = require("crypto");

// Load credentials from .env file
const envPath = path.resolve(process.cwd(), ".env");
const envConfig = dotenv.config({ path: envPath }).parsed || {};

// Create S3 client with credentials from .env file
const s3Client = new S3Client({
  region: envConfig.AWS_REGION,
  credentials: {
    accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
    secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
  },
});

// Get project-related variables from process.env (Docker/ECS environment)
const PROJECT_URI = process.env.PROJECT_URI;
const DEPLOYEMENT_ID = process.env.DEPLOYEMENT_ID;
const PROJECT_INSTALL_COMMAND = process.env.PROJECT_INSTALL_COMMAND;
const PROJECT_BUILD_COMMAND = process.env.PROJECT_BUILD_COMMAND;
const PROJECT_ROOT_DIR = process.env.PROJECT_ROOT_DIR;
const S3_BUCKET_NAME = envConfig.S3_BUCKET_NAME;

// Initialize clients
const kafka = new Kafka({
  clientId: envConfig.KAFKA_CLIENT_ID,
  brokers: [envConfig.KAFKA_BROKER],
  ssl: {
    ca: [fs.readFileSync(path.join(__dirname, "ca.pem"), "utf-8")],
  },
  sasl: {
    username: envConfig.SASL_USERNAME,
    password: envConfig.SASL_PASSWORD,
    mechanism: envConfig.SASL_MECHANISM,
  },
});

const client = createClient({
  database: envConfig.CLICKHOUSE_DB,
  url: envConfig.CLICKHOUSE_HOST,
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

const consumer = kafka.consumer({ groupId: "build-logs-consumer" });

let isExiting = false;

async function publishLog(log) {
  if (isExiting) return;
  
  try {
    await producer.connect();
    await producer.send({
      topic: `build-logs`,
      messages: [{ key: "log", value: JSON.stringify({ PROJECT_URI, DEPLOYEMENT_ID, log }) }],
    });
  } catch (error) {
    console.error("Error publishing log:", error);
  }
}

// Force exit is used to cleanup resources and exit the process, it's necessary to avoid memory leaks
async function forceExit() {
  if (isExiting) return;
  isExiting = true;

  console.log("Force exiting process...");
  try {
    await producer.disconnect();
    await consumer.disconnect();
    await client.close();
    
    // Force exit after a short delay to allow cleanup
    setTimeout(() => process.exit(0), 1000);
  } catch (error) {
    console.error("Error during force exit:", error);
    process.exit(1);
  }
}

async function InitializeScript() {
  try {
    console.log("Executing script...");
    await publishLog("Executing script...");
    const outputDir = path.join(__dirname, "output");

    const projectEnvVars = Object.keys(process.env)
      .filter((key) => key.startsWith("PROJECT_ENVIRONMENT_"))
      .reduce((envVars, key) => {
        envVars[key] = process.env[key];
        return envVars;
      }, {});

    return new Promise((resolve, reject) => {
      const buildProcess = exec(
        `cd ${outputDir} && ${PROJECT_INSTALL_COMMAND} && ${PROJECT_BUILD_COMMAND}`,
        {
          cwd: PROJECT_ROOT_DIR,
          env: { ...process.env, ...projectEnvVars },
        }
      );

      buildProcess.stdout.on("data", async (data) => {
        console.log(data.toString());
        await publishLog(data.toString());
      });

      buildProcess.stderr.on("data", async (data) => {
        console.error("Error:", data.toString());
        await publishLog(data.toString());
      });

      buildProcess.on("close", async (code) => {
        try {
          console.log(`Build complete with code ${code}`);
          await publishLog(`Build complete with code ${code}`);

          const distDir = path.join(outputDir, "dist");
          const distFiles = fs.readdirSync(distDir, { recursive: true });

          for (const file of distFiles) {
            const filePath = path.join(distDir, file);
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log(`Uploading ${filePath}...`);
            await publishLog(`Uploading ${filePath}...`);

            const command = new PutObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: `__outputs/${PROJECT_URI}/${file}`,
              Body: fs.createReadStream(filePath),
              ContentType: mime.lookup(filePath),
            });

            await s3Client.send(command);
          }

          console.log("Upload complete...");
          await publishLog("Upload complete...");
          
          // After upload complete, wait a short time for the last log to be processed
          setTimeout(async () => {
            await forceExit();
          }, 2000);
        } catch (error) {
          console.error("Error in build process:", error);
          await publishLog(`Error in build process: ${error.message}`);
          await forceExit();
        }
      });

      buildProcess.on("error", async (error) => {
        console.error("Execution error:", error);
        await publishLog(`Execution error: ${error.message}`);
        await forceExit();
      });
    });
  } catch (error) {
    console.error("Error in InitializeScript:", error);
    await forceExit();
  }
}

const initializeKafkaConsumer = async () => {
  try {
    const event_id = randomUUID();
    await consumer.connect();
    
    // Set to read only new messages by setting fromBeginning to false
    await consumer.subscribe({ topic: "build-logs", fromBeginning: false });

    await consumer.run({
      eachBatch: async function ({
        batch,
        heartbeat,
        commitOffsetsIfNecessary,
      }) {
        const messages = batch.messages;
        console.log(`Recv. ${messages.length} messages..`);

        for (const message of messages) {
          if (!message.value) continue;

          const stringMessage = message.value.toString();
          const parsedMessage = JSON.parse(stringMessage);
          
          // Only process logs for current deployment
          if (parsedMessage.DEPLOYEMENT_ID !== DEPLOYEMENT_ID) {
            continue;
          }

          console.log({ log: parsedMessage.log, DEPLOYEMENT_ID: parsedMessage.DEPLOYEMENT_ID });

          try {
            if (!isExiting) {
              const { query_id } = await client.insert({
                table: "log_events",
                values: [
                  {
                    event_id,
                    deployment_id: parsedMessage.DEPLOYEMENT_ID,
                    log: parsedMessage.log,
                  },
                ],
                format: "JSONEachRow",
              });

              console.log(query_id);

              await commitOffsetsIfNecessary({
                topics: [
                  {
                    topic: "build-logs",
                    partitions: [
                      {
                        partition: batch.partition,
                        offset: message.offset,
                      },
                    ],
                  },
                ],
              });

              await heartbeat();
            }
          } catch (err) {
            console.log(err);
          }
        }
      },
      autoCommit: false,
      eachBatchAutoResolve: true,
    });
  } catch (error) {
    console.error("Failed to initialize Kafka consumer:", error);
    await forceExit();
  }
};

// Set a global timeout
setTimeout(async () => {
  console.log("Global timeout reached (30 minutes). Force exiting...");
  await forceExit();
}, 30 * 60 * 1000);

// Handle process signals
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Cleaning up...');
  await forceExit();
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT. Cleaning up...');
  await forceExit();
});

InitializeScript();
initializeKafkaConsumer();