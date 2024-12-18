import { prisma } from "@/lib/prisma";
import { DeploymentModel } from "@/types/models/Deployment.model";
import { fetchGitLatestCommit } from "@/utils/github";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { DeploymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

const ecsClient = new ECSClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// GitHub API client
const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

// Function to create a Github webhook for a given repository
async function createGitHubWebhook(
  repoUrl: string,
  secret: string,
  webhookUrl: string
) {
  const [owner, repo] = repoUrl.replace("https://github.com/", "").split("/");

  try {
    // Check if webhook already exists
    const { data: webhooks } = await octokit.repos.listWebhooks({
      owner,
      repo,
    });

    if (webhooks.some((hook) => hook.config.url === webhookUrl)) {
      console.log("Webhook already exists for this repository.");
      return;
    }

    // Create webhook which only triggers on push events
    await octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webhookUrl,
        secret,
        content_type: "json",
      },
      events: ["push"],
      active: true,
    });

    console.log("Webhook created successfully.");
  } catch (error) {
    console.error("Failed to create GitHub webhook:", error);
    throw new Error("Failed to create GitHub webhook");
  }
}

// GET route to get all deployments

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({
        status: 400,
        message: "projectId is required",
      });
    }

    const deployments = await prisma.deployment.findMany({
      where: { projectId },
    });

    return NextResponse.json({ status: 200, data: deployments });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

// POST route to start a deployment
export async function POST(req: NextRequest) {
  try {
    // Extract the access token from the Authorization header
    const authHeader = req.headers.get("Authorization");
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
      buildCommand,
      installCommand,
      projectRootDir,
      environmentVariables,
    } = await req.json();

    const parsedData = DeploymentModel.safeParse({
      projectId,
      gitBranchName,
      gitRepoUrl,
      gitCommitHash,
      environmentVariables,
    });

    if (!parsedData.success) {
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

    try {
      const webhookUrl = `${process.env.BASE_URL}/api/git/webhook?projectId=${projectId}`;
      const webhookSecret = process.env.WEBHOOK_SECRET!;

      await createGitHubWebhook(gitRepoUrl, webhookSecret, webhookUrl);
    } catch (error) {
      return NextResponse.json({
        status: 500,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }

    const gitInfo = await fetchGitLatestCommit({
      accessToken,
      repoUrl: gitRepoUrl,
      branch: gitBranchName,
    });

    console.log(gitInfo);

    // Deployment logic
    const command = new RunTaskCommand({
      cluster: process.env.CLUSTER!,
      taskDefinition: process.env.TASK!,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: process.env.SUBNETS!.split(","),
          securityGroups: process.env.SECURITY_GROUPS!.split(","),
          assignPublicIp: "ENABLED",
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: process.env.AWS_ECR_IMAGE,
            environment: [
              { name: "PROJECT_ID", value: projectId },
              { name: "GITHUB_REPO_URL", value: gitRepoUrl },
              {
                name: "PROJECT_INSTALL_COMMAND",
                value: installCommand ?? "npm install",
              },
              {
                name: "PROJECT_BUILD_COMMAND",
                value: buildCommand ?? "npm run build",
              },
              {
                name: "PROJECT_ROOT_DIR",
                value: projectRootDir ?? "./",
              },
              ...Object.entries(environmentVariables ?? {}).map(
                ([key, value]) => ({
                  name: `PROJECT_ENVIRONMENT_${key}`,
                  value,
                })
              ),
            ],
          },
        ],
      },
    });

    try {
      const response = await ecsClient.send(command);

      if (!response.tasks || response.tasks.length === 0) {
        return NextResponse.json({
          status: 500,
          message: "Failed to start deployment task",
        });
      }

      // Create a deployment record
      await prisma.deployment.create({
        data: {
          projectId,
          gitBranchName,
          gitCommitHash,
          deploymentStatus: DeploymentStatus.IN_PROGRESS,
          deploymentMessage: "Deployment has been started",
        },
      });
    } catch (error) {
      console.error("ECS Task deployment failed:", error);

      // Create failed deployment record
      await prisma.deployment.create({
        data: {
          projectId,
          gitBranchName,
          gitCommitHash,
          deploymentStatus: DeploymentStatus.FAILED,
          deploymentMessage:
            error instanceof Error
              ? error.message
              : "Error while deploying your service, an unknown error occurred",
        },
      });

      return NextResponse.json({
        status: 500,
        message: "Failed to start deployment",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  } catch {
    return NextResponse.json({ status: 500, message: "Internal server error" });
  }
}