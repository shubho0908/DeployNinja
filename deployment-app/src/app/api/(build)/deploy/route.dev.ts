import { prisma } from "@/lib/prisma";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { fetchGitLatestCommit } from "@/utils/github";
import { DeploymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { exec } from "child_process";
import { handleApiError } from "@/redux/api/util";

/**
 * Creates a GitHub webhook for a specified repository.
 *
 * This function checks if a webhook with the given URL already exists
 * for the specified GitHub repository. If not, it creates a new webhook
 * with the provided configuration and updates the project in the database
 * with the webhook ID.
 *
 * @param {string} projectId - The ID of the project to update in the database.
 * @param {string} repoUrl - The URL of the GitHub repository.
 * @param {string} secret - The secret used for securing the webhook.
 * @param {string} webhookUrl - The URL where the webhook should send events.
 * @param {string} accessToken - The GitHub access token for authentication.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * 
 * @throws {Error} - Throws an error if the GitHub API request fails.
 */

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
     return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create GitHub webhook",
      },
      { status: 500 }
    );
  }
}

/**
 * Deploys a Docker container using the Docker CLI, setting environment variables and
 * the DEPLOYEMENT_ID environment variable to the given deployment ID.
 *
 * @param deploymentId The ID of the deployment to deploy.
 * @param ecrImage The ECR image to deploy.
 * @param environmentVariables Optional environment variables to set in the container.
 * @returns A promise that resolves if the container starts successfully, or rejects
 * if there is an error.
 */
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
     return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create GitHub webhook",
      },
      { status: 500 }
    );
  }
}

/**
 * GET route to fetch all deployments for a given project ID.
 *
 * @param {NextRequest} req - The incoming request.
 * @returns {Promise<NextResponse>} - A promise that resolves to the response.
 * @throws {Error} - If projectId is not provided, or if there is an error fetching deployments.
 */
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
     return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create GitHub webhook",
      },
      { status: 500 }
    );
  }
}

/**
 * POST route to start a deployment.
 *
 * @param {NextRequest} req - The incoming request.
 * @returns {Promise<NextResponse>} - A promise that resolves to the response.
 * @throws {Error} - If the request is invalid, or if there is an error starting the deployment.
 */

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
       return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create GitHub webhook",
      },
      { status: 500 }
    );
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
     return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create GitHub webhook",
      },
      { status: 500 }
    );
  }
}

    /**
     * PATCH route to update the deployment status.
     *
     * @param {NextRequest} req - The incoming request.
     * @returns {Promise<NextResponse>} - A promise that resolves to the response.
     * @throws {Error} - If deploymentId is not provided, or if there is an error updating the deployment status.
     */
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
     return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create GitHub webhook",
      },
      { status: 500 }
    );
  }
}
