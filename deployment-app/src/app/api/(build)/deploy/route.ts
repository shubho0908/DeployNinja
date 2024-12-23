import { prisma } from "@/lib/prisma";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { fetchGitLatestCommit } from "@/utils/github";
import { DeploymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { exec } from "child_process";
import { handleApiError } from "@/redux/api/util";

// Function to create a Github webhook for a given repository
async function createGitHubWebhook(
  projectId: string,
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
    } else {
      // Create webhook using direct request method
      const webhook = await octokit.request(
        "POST /repos/{owner}/{repo}/hooks",
        {
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
        }
      );

      await prisma.project.update({
        where: { id: projectId },
        data: { webhookId: webhook.data.id },
      });

      console.log("Webhook created successfully. ", webhook.data.id);
    }
  } catch (error) {
    throw new Error(await handleApiError(error));
  }
}

// Function to run Docker deployment
async function runDockerDeploymentWithCLI(
  deploymentId: string,
  ecrImage: string,
  environmentVariables: Record<string, string> = {}
) {
  try {
    const envVars = Object.entries(environmentVariables)
      .map(([key, value]) => `-e ${key}="${value}"`)
      .join(" ");

    const command = `docker run -d -i -t ${envVars} -e DEPLOYEMENT_ID=${deploymentId} ${ecrImage}`;
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
    throw new Error(await handleApiError(error));
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      throw new Error(await handleApiError("projectId is required"));
    }

    const deployments = await prisma.deployment.findMany({
      where: { projectId },
    });

    return NextResponse.json({ status: 200, data: deployments });
  } catch (error) {
    throw new Error(await handleApiError(error));
  }
}

// POST route to start a deployment
export async function POST(req: NextRequest) {
  try {
    console.log("⚡️ POST request received ⚡");
    // Extract the access token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error(
        await handleApiError("Authorization token missing or invalid")
      );
    }

    const accessToken = authHeader.split(" ")[1];

    const {
      projectId,
      gitBranchName,
      gitCommitHash,
      deploymentStatus,
      environmentVariables,
    } = await req.json();

    const envVarsObject =
      typeof environmentVariables === "string"
        ? JSON.parse(environmentVariables)
        : environmentVariables;

    const parsedData = DeploymentModel.safeParse({
      projectId,
      gitBranchName,
      gitCommitHash,
      deploymentStatus,
      environmentVariables: envVarsObject,
    });

    if (!parsedData.success) {
      console.log("Error ", parsedData.error);
      throw new Error(await handleApiError("Invalid request"));
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(await handleApiError("Project not found"));
    }

    // TODO: add if request maker is webhook
    try {
      const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/git/webhook?projectId=${projectId}`;
      const webhookSecret = process.env.WEBHOOK_SECRET!;

      await createGitHubWebhook(
        projectId,
        project.gitRepoUrl,
        webhookSecret,
        webhookUrl,
        accessToken
      );
    } catch (error) {
      throw new Error(await handleApiError(error));
    }

    const gitInfo = await fetchGitLatestCommit({
      accessToken,
      repoUrl: project.gitRepoUrl,
      branch: gitBranchName,
    });

    try {
      // Create a deployment record
      const deployment = await prisma.deployment.create({
        data: {
          projectId,
          gitBranchName,
          gitCommitHash: gitInfo.latestCommit,
          deploymentStatus: DeploymentStatus.IN_PROGRESS,
          deploymentMessage: "Deployment has been started",
          environmentVariables: JSON.stringify(envVarsObject),
        },
      });

      const envVarsObjectWithProjectUri = {
        ...envVarsObject,
        PROJECT_URI: project.subDomain,
      };

      await runDockerDeploymentWithCLI(
        deployment.id,
        process.env.AWS_ECR_IMAGE_URI!,
        envVarsObjectWithProjectUri
      );

      console.log("Deployment created successfully:", deployment);

      return NextResponse.json({
        status: 200,
        message: "Deployment started",
        data: {
          deployment,
          subDomain: project.subDomain,
          url: `http://${project.subDomain}.localhost:8000`,
        },
      });
    } catch (error) {
      // Create a deployment record
      await prisma.deployment.create({
        data: {
          projectId,
          gitBranchName,
          gitCommitHash: gitInfo.latestCommit,
          deploymentStatus: DeploymentStatus.FAILED,
          deploymentMessage: "Deployment has been started",
          environmentVariables: JSON.stringify(envVarsObject),
        },
      });
      throw new Error(await handleApiError("Failed to start deployment"));
    }
  } catch (error) {
    throw new Error(await handleApiError(error));
  }
}

// Update deployment status when the deployment is complete/failed
export async function PATCH(req: NextRequest) {
  try {
    const deploymentId = req.nextUrl.searchParams.get("deploymentId");
    const { deploymentStatus } = await req.json();

    if (!deploymentId) {
      throw new Error(await handleApiError("deploymentId is required"));
    }

    if (!deploymentStatus) {
      throw new Error(await handleApiError("deploymentStatus is required"));
    }

    const deployment = await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        deploymentStatus: deploymentStatus as DeploymentStatus,
      },
    });

    return NextResponse.json({
      status: 200,
      data: deployment,
    });
  } catch (error: unknown) {
    throw new Error(await handleApiError(error));
  }
}
