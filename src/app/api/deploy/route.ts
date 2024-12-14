import { prisma } from "@/lib/prisma";
import { DeploymentModel } from "@/types/models/Deployment.model";
import { fetchGitLatestCommit } from "@/utils/github";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { DeploymentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// AWS ECS Client
const ecsClient = new ECSClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// POST route to start a deployment
export async function POST(req: NextRequest) {
  try {
    const {
      projectId,
      subDomain,
      gitBranchName,
      gitRepoUrl,
      buildCommand,
      installCommand,
    } = await req.json();

    // Validate the request data
    const parsedData = DeploymentModel.safeParse({
      projectId,
      subDomain,
      gitBranchName,
      gitRepoUrl,
    });

    if (!parsedData.success) {
      return NextResponse.json({
        status: 400,
        message: "Invalid request",
        data: parsedData.error,
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json({ status: 404, message: "Project not found" });
    }

    // Get the latest commit hash from the GitHub repository
    const gitInfo = await fetchGitLatestCommit({
      repoUrl: gitRepoUrl,
      branch: gitBranchName,
    });

    // Run the deployment task
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
            name: "builder-image",
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
            ],
          },
        ],
      },
    });

    try {
      // Run the deployment task
      const response = await ecsClient.send(command);

      if (!response.tasks || response.tasks.length === 0) {
        // No tasks were created
        return NextResponse.json({
          status: 500,
          message: "Failed to start deployment task",
        });
      }

      const deploy = await prisma.deployment.create({
        data: {
          projectId,
          subDomain,
          gitBranchName,
          gitRepoUrl,
          gitCommitHash: gitInfo.latestCommit,
          gitCommitUrl: `${gitRepoUrl}/commit/${gitInfo.latestCommit}`,
          deploymentStatus: DeploymentStatus.QUEUED,
        },
      });

      return NextResponse.json({
        status: 200,
        message: "Deployment started",
        data: deploy,
      });
    } catch (error) {
      console.error("ECS Task deployment failed:", error);

      // Create a failed deployment record
      await prisma.deployment.create({
        data: {
          projectId,
          subDomain,
          gitBranchName,
          gitRepoUrl,
          gitCommitHash: gitInfo.latestCommit,
          gitCommitUrl: `${gitRepoUrl}/commit/${gitInfo.latestCommit}`,
          deploymentStatus: DeploymentStatus.FAILED,
          deploymentMessage:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      });

      return NextResponse.json({
        status: 500,
        message: "Failed to start deployment",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  } catch (error) {
    return NextResponse.json({ status: 500, message: "Internal server error" });
  }
}

// PATCH route to update deployment status and message
export async function PATCH(req: NextRequest) {
  try {
    const { deploymentId, deploymentStatus, deploymentMessage } =
      await req.json();

    // Validate the input
    if (!deploymentId || !deploymentStatus) {
      return NextResponse.json({
        status: 400,
        message: "deploymentId and deploymentStatus are required",
      });
    }

    const deployment = await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        deploymentStatus,
        ...(deploymentMessage && { deploymentMessage }),
      },
    });

    return NextResponse.json({
      status: 200,
      message: "Deployment completed",
      data: deployment,
    });
  } catch (error) {
    console.error("Error updating deployment:", error);
    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

// Delete route to delete a deployment
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const deploymentId = searchParams.get("deploymentId");

    if (!deploymentId) {
      return NextResponse.json({
        status: 400,
        message: "deploymentId is required",
      });
    }

    await prisma.deployment.delete({
      where: { id: deploymentId },
    });

    return NextResponse.json({
      status: 200,
      message: `Deployment with id ${deploymentId} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json({ status: 500, message: "Internal server error" });
  }
}
