import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProjectModel } from "@/types/schemas/Project";
import { generateSlug } from "random-word-slugs";
import { Octokit } from "@octokit/rest";
import { auth } from "@/auth";
import { handleApiError } from "@/redux/api/util";
import { copyFolder, deleteFolder } from "./s3BucketOperations";

// GET route to get all projects — Dashboard
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      throw new Error(await handleApiError("userId is required"));
    }

    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      include: { deployments: true },
    });
    return NextResponse.json({ status: 200, project: projects });
  } catch (error) {
    throw new Error(await handleApiError(error));
  }
}

// POST route to create a new project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subDomain = generateSlug();
    const validatedData = ProjectModel.safeParse({ ...body, subDomain });

    if (!validatedData.success) {
      throw new Error(
        await handleApiError(
          `Invalid request data: ${validatedData.error.flatten().fieldErrors}`
        )
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
    throw new Error(await handleApiError(error));
  }
}

// PATCH route to update sub-domain
export async function PATCH(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const deploymentId = req.nextUrl.searchParams.get("deploymentId");
    const { newSubDomain } = await req.json();

    if (!projectId || !deploymentId) {
      throw new Error(
        await handleApiError("Project ID and deployment ID are required")
      );
    }

    if (!newSubDomain) {
      throw new Error(await handleApiError("newSubDomain is required"));
    }

    // Get the existing project
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new Error(await handleApiError("Project not found"));
    }

    const oldSubDomain = existingProject.subDomain;

    // Only proceed if the subdomain is actually different
    if (oldSubDomain === newSubDomain) {
      throw new Error(
        await handleApiError("New subdomain is same as current subdomain")
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
      throw new Error(await handleApiError("Deployment not found"));
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
    throw new Error(await handleApiError(error));
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
      throw new Error(await handleApiError("projectId is required"));
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true },
    });

    if (!project) {
      throw new Error(await handleApiError(`Project not found`));
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
        throw new Error(await handleApiError(error));
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
    throw new Error(await handleApiError(error));
  }
}
