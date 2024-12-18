import { prisma } from "@/lib/prisma";
import { DeploymentModel } from "@/types/models/Deployment.model";
import { fetchGitLatestCommit } from "@/utils/github";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { DeploymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { exec } from "child_process";

const ecsClient = new ECSClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Function to create a Github webhook for a given repository
async function createGitHubWebhook(
  repoUrl: string,
  secret: string,
  webhookUrl: string,
  accessToken: string
) {
  // GitHub API client
  const octokit = new Octokit({
    auth: accessToken,
  });

  const [owner, repo] = repoUrl.replace("https://github.com/", "").split("/");

  try {
    console.log("Checking if webhook already exists...");

    // Check if webhook already exists
    const { data: webhooks } = await octokit.request(
      "GET /repos/{owner}/{repo}/hooks",
      {
        owner,
        repo,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (webhooks.some((hook) => hook.config.url === webhookUrl)) {
      console.log("Webhook already exists for this repository.");
      return;
    }

    // Create webhook using direct request method
    await octokit.request("POST /repos/{owner}/{repo}/hooks", {
      owner,
      repo,
      config: {
        url: webhookUrl,
        secret,
        content_type: "json",
      },
      events: ["push"],
      active: true,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    console.log("Webhook created successfully.");
  } catch (error: unknown) {
    // Type guard to check if error is an object with status property
    if (
      error instanceof Error &&
      "status" in error &&
      (error as { status: number }).status === 404
    ) {
      try {
        // Attempt to create the webhook directly if the repository is not found
        await octokit.request("POST /repos/{owner}/{repo}/hooks", {
          owner,
          repo,
          config: {
            url: webhookUrl,
            secret,
            content_type: "json",
          },
          events: ["push"],
          active: true,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });
        console.log("Webhook created successfully after 404 error.");
      } catch (createError: unknown) {
        // Handle potential error in webhook creation
        if (createError instanceof Error) {
          console.error(
            "Failed to create GitHub webhook after 404:",
            createError.message
          );
          throw new Error(
            `Failed to create GitHub webhook: ${createError.message}`
          );
        }

        // Fallback for any unexpected errors
        console.error("Unexpected error creating webhook:", createError);
        throw createError;
      }
    } else {
      // Handle other types of errors
      console.error("Failed to create GitHub webhook:", error);
      throw error;
    }
  }
}

// Function to run Docker deployment
async function runDockerDeploymentWithCLI(
  projectId: string,
  ecrImage: string,
  environmentVariables: Record<string, string> = {}
) {
  try {
    const envVars = Object.entries(environmentVariables)
      .map(([key, value]) => `-e ${key}="${value}"`)
      .join(" ");

    const command = `docker run -d -i -t ${envVars} ${ecrImage}`;
    console.log(`Running command: ${command}`);

    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("Docker CLI error:", stderr || error.message);
          reject(new Error("Docker CLI deployment failed"));
        } else {
          console.log("Docker CLI output:", stdout);
          resolve(stdout);
        }
      });
    });

    console.log("Docker container started successfully.");
  } catch (error) {
    console.error("Docker CLI deployment failed:", error);
    throw error;
  }
}

// POST route to start a deployment
export async function POST(req: NextRequest) {
  try {
    console.log("POST request received");

    // Extract the access token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    const requestMaker = req.headers.get("X-Request-Maker");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token missing or invalid" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.split(" ")[1];

    const {
      projectId,
      gitBranchName,
      gitRepoUrl,
      gitCommitHash,
      // buildCommand,
      // installCommand,
      // projectRootDir,
      environmentVariables,
    } = await req.json();

    console.log("Yaha tk sb theek");

    const envVarsObject =
      typeof environmentVariables === "string"
        ? JSON.parse(environmentVariables)
        : environmentVariables;
    const parsedData = DeploymentModel.safeParse({
      projectId,
      gitBranchName,
      gitRepoUrl,
      gitCommitHash,
      environmentVariables: envVarsObject,
    });

    if (!parsedData.success) {
      console.log("Error ", parsedData.error);

      return NextResponse.json({
        status: 400,
        message: "Invalid request",
        data: parsedData.error,
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ status: 404, message: "Project not found" });
    }

    if (requestMaker !== "webhook") {
      try {
        const webhookUrl = `${process.env.BASE_URL}/api/git/webhook?projectId=${projectId}&token=${accessToken}`;
        const webhookSecret = process.env.WEBHOOK_SECRET!;

        await createGitHubWebhook(
          gitRepoUrl,
          webhookSecret,
          webhookUrl,
          accessToken
        );
      } catch (error) {
        return NextResponse.json({
          status: 500,
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    const gitInfo = await fetchGitLatestCommit({
      accessToken,
      repoUrl: gitRepoUrl,
      branch: gitBranchName,
    });

    // Deployment logic remains unchanged
    // const command = new RunTaskCommand({
    //   cluster: process.env.CLUSTER!,
    //   taskDefinition: process.env.TASK!,
    //   launchType: "FARGATE",
    //   count: 1,
    //   networkConfiguration: {
    //     awsvpcConfiguration: {
    //       subnets: process.env.SUBNETS!.split(","),
    //       securityGroups: process.env.SECURITY_GROUPS!.split(","),
    //       assignPublicIp: "ENABLED",
    //     },
    //   },
    //   overrides: {
    //     containerOverrides: [
    //       {
    //         name: process.env.AWS_ECR_IMAGE,
    //         environment: [
    //           { name: "PROJECT_ID", value: projectId },
    //           { name: "GITHUB_REPO_URL", value: gitRepoUrl },
    //           {
    //             name: "PROJECT_INSTALL_COMMAND",
    //             value: installCommand ?? "npm install",
    //           },
    //           {
    //             name: "PROJECT_BUILD_COMMAND",
    //             value: buildCommand ?? "npm run build",
    //           },
    //           {
    //             name: "PROJECT_ROOT_DIR",
    //             value: projectRootDir ?? "./",
    //           },
    //           ...Object.entries(environmentVariables ?? {}).map(
    //             ([key, value]) => ({
    //               name: `PROJECT_ENVIRONMENT_${key}`,
    //               value,
    //             })
    //           ),
    //         ],
    //       },
    //     ],
    //   },
    // });

    // try {
    // const response = await ecsClient.send(command);

    // if (!response.tasks || response.tasks.length === 0) {
    //   return NextResponse.json({
    //     status: 500,
    //     message: "Failed to start deployment task",
    //   });
    // }

    try {
      await runDockerDeploymentWithCLI(
        projectId,
        process.env.AWS_ECR_IMAGE_URI!,
        envVarsObject
      );

      // Create a deployment record
      const deployment = await prisma.deployment.create({
        data: {
          projectId,
          gitBranchName,
          gitCommitHash,
          deploymentStatus: DeploymentStatus.IN_PROGRESS,
          deploymentMessage: "Deployment has been started",
          environmentVariables: JSON.stringify(envVarsObject),
        },
      });

      console.log("Deployment created successfully:", deployment);

      return NextResponse.json({
        status: 200,
        message: "Deployment started",
        data: deployment,
      });
    } catch (error) {
      return NextResponse.json({
        status: 500,
        message: "Failed to start deployment",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
    // } catch (error) {
    //   console.error("ECS Task deployment failed:", error);

    //   // Create failed deployment record
    //   await prisma.deployment.create({
    //     data: {
    //       projectId,
    //       gitBranchName,
    //       gitCommitHash,
    //       deploymentStatus: DeploymentStatus.FAILED,
    //       deploymentMessage:
    //         error instanceof Error
    //           ? error.message
    //           : "Error while deploying your service, an unknown error occurred",
    //     },
    //   });

    //   return NextResponse.json({
    //     status: 500,
    //     message: "Failed to start deployment",
    //     error:
    //       error instanceof Error ? error.message : "Unknown error occurred",
    //   });
    // }
  } catch {
    return NextResponse.json({ status: 500, message: "Internal server error" });
  }
}