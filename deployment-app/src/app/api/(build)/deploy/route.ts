import { prisma } from "@/lib/prisma";
import { DeploymentModel } from "@/types/schemas/Deployment";
import { fetchGitLatestCommit } from "@/utils/github";
import { DeploymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/redux/api/util";
import { RunTaskCommand } from "@aws-sdk/client-ecs";
import { createGitHubWebhook } from "./createGithubWebhook";
import { ecsClient } from "@/lib/aws";
import { auth } from "@/auth";

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
      throw new Error("Authorization token missing or invalid");
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
      throw new Error("Invalid request");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Verify required AWS environment variables
    const requiredEnvVars = [
      "CLUSTER",
      "TASK",
      "SUBNETS",
      "SECURITY_GROUPS",
      "AWS_ECR_IMAGE",
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Create GitHub webhook
    try {
      const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/git/webhook?projectId=${projectId}`;
      const webhookSecret = process.env.WEBHOOK_SECRET;

      if (!webhookSecret) {
        throw new Error("Webhook secret is not configured");
      }

      await createGitHubWebhook(
        projectId,
        project.gitRepoUrl,
        webhookSecret,
        webhookUrl,
        accessToken
      );
    } catch (error) {
      console.error("Webhook creation failed:", error);
      throw new Error(await handleApiError(error));
    }

    const gitInfo = await fetchGitLatestCommit({
      accessToken,
      repoUrl: project.gitRepoUrl,
      branch: gitBranchName,
    });

    try {
      const envVarsObjectWithProjectUri = {
        ...envVarsObject,
        PROJECT_URI: project.subDomain,
      };

      // Create a deployment record with initial status
      const deployment = await prisma.deployment.create({
        data: {
          projectId,
          gitBranchName,
          gitCommitHash: gitInfo.latestCommit,
          deploymentStatus: DeploymentStatus.IN_PROGRESS,
          deploymentMessage: "Deployment has been started",
          environmentVariables: JSON.stringify(envVarsObjectWithProjectUri),
        },
      });

      console.log("Deployment created successfully:", deployment);

      // Transform environment variables into the correct format for ECS
      const environmentVariables = Object.entries(
        envVarsObjectWithProjectUri
      ).map(([name, value]) => ({
        name,
        value: String(value),
      }));

      // Create ECS task
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
              name: process.env.AWS_ECR_IMAGE!,
              environment: [
                ...environmentVariables,
                { name: "DEPLOYMENT_ID", value: deployment.id },
              ],
            },
          ],
        },
      });

      const response = await ecsClient.send(command);

      // Enhanced validation for ECS task response
      if (!response.tasks || response.tasks.length === 0) {
        throw new Error(
          await handleApiError(
            "Failed to start deployment task: No tasks created"
          )
        );
      }

      const task = response.tasks[0];
      if (!task.taskArn) {
        throw new Error(
          await handleApiError(
            "Failed to start deployment task: TaskArn is missing"
          )
        );
      }

      console.log("Task created successfully", task.taskArn);

      // Update deployment with taskArn and validate the update
      const updatedDeployment = await prisma.deployment.update({
        where: { id: deployment.id },
        data: { taskArn: task.taskArn },
        select: { id: true, taskArn: true },
      });

      if (!updatedDeployment.taskArn) {
        throw new Error(await handleApiError("Failed to update deployment"));
      }

      return NextResponse.json({
        status: 200,
        message: "Deployment started",
        data: {
          deployment: updatedDeployment,
          subDomain: project.subDomain,
          url: `http://${project.subDomain}.localhost:8000`,
        },
      });
    } catch (error) {
      const envVarsObjectWithProjectUri = {
        ...envVarsObject,
        PROJECT_URI: project.subDomain,
      };

      // Create a failed deployment record with detailed error message
      const failureMessage =
        error instanceof Error
          ? `Deployment failed: ${error.message}`
          : "Failed to start deployment with unknown error";

      await prisma.deployment.create({
        data: {
          projectId,
          gitBranchName,
          gitCommitHash: gitInfo.latestCommit,
          deploymentStatus: DeploymentStatus.FAILED,
          deploymentMessage: failureMessage,
          environmentVariables: JSON.stringify(envVarsObjectWithProjectUri),
        },
      });
      throw error;
    }
  } catch (error) {
    console.error("Deployment failed:", error);
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
