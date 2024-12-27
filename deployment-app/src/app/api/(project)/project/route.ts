import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProjectModel } from "@/types/schemas/Project";
import { generateSlug } from "random-word-slugs";
import { Octokit } from "@octokit/rest";
import { auth } from "@/auth";
import { copyFolder, deleteFolder } from "./s3BucketOperations";

// GET route to get all projects — Dashboard
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      include: { deployments: true },
    });
    return NextResponse.json({ status: 200, project: projects });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}

// POST route to create a new project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subDomain = generateSlug();
    const validatedData = ProjectModel.safeParse({ ...body, subDomain });

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: `Invalid request data: ${
            validatedData.error.flatten().fieldErrors
          }`,
        },
        { status: 400 }
      );
    }

    const {
      name,
      ownerId,
      framework,
      installCommand,
      buildCommand,
      projectRootDir,
      gitRepoUrl,
    } = validatedData.data;
    const project = await prisma.project.create({
      data: {
        name,
        ownerId,
        framework,
        subDomain,
        gitRepoUrl,
        installCommand,
        buildCommand,
        projectRootDir,
      },
    });

    return NextResponse.json({ status: 200, project: project });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create project",
      },
      { status: 500 }
    );
  }
}

// PATCH route to update sub-domain
export async function PATCH(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const deploymentId = req.nextUrl.searchParams.get("deploymentId");
    const { newSubDomain } = await req.json();

    if (!projectId || !deploymentId || !newSubDomain) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get the existing project
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return NextResponse.json(
        {
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    const oldSubDomain = existingProject.subDomain;

    // Only proceed if the subdomain is actually different
    if (oldSubDomain === newSubDomain) {
      return NextResponse.json(
        {
          error: "New subdomain is same as current subdomain",
        },
        { status: 400 }
      );
    }

    const oldPrefix = `__outputs/${oldSubDomain}/`;
    const newPrefix = `__outputs/${newSubDomain}/`;

    // Perform the folder rename operation
    await copyFolder(process.env.AWS_S3_BUCKET_NAME!, oldPrefix, newPrefix);

    // Update the project in the database
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { subDomain: newSubDomain },
    });

    // First get the existing deployment to preserve its current environment variables
    const existingDeployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!existingDeployment) {
      return NextResponse.json(
        {
          error: "Deployment not found",
        },
        { status: 404 }
      );
    }

    // Parse existing environment variables
    const currentEnvVars = existingDeployment.environmentVariables
      ? JSON.parse(existingDeployment.environmentVariables)
      : {};

    // Only update the PROJECT_URI while preserving all other variables
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        environmentVariables: JSON.stringify({
          ...currentEnvVars,
          PROJECT_URI: newSubDomain,
        }),
      },
    });

    return NextResponse.json({
      status: 200,
      message: "Project subdomain updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update project",
      },
      { status: 500 }
    );
  }
}

// DELETE route to delete a project
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const octokit = new Octokit({
      auth: session?.accessToken,
    });
    const projectId = req.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete webhook if it exists
    if (project.webhookId) {
      const [owner, repo] = project.gitRepoUrl
        .replace("https://github.com/", "")
        .split("/");
      try {
        await octokit.request("DELETE /repos/{owner}/{repo}/hooks/{hook_id}", {
          owner,
          repo,
          hook_id: project.webhookId,
        });
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Failed to delete GitHub webhook",
          },
          { status: 500 }
        );
      }
    }

    const folderPrefix = `__outputs/${project.subDomain}/`;

    // Delete deployments and project
    await prisma.deployment.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });

    // Delete folder from S3
    await deleteFolder(process.env.AWS_S3_BUCKET_NAME!, folderPrefix);

    return NextResponse.json({
      status: 200,
      message: `Project and S3 folder deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete project",
      },
      { status: 500 }
    );
  }
}
