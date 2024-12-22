import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProjectModel } from "@/types/schemas/Project";
import { generateSlug } from "random-word-slugs";
import {
  S3Client,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { Octokit } from "@octokit/rest";
import { auth } from "@/auth";
import { handleApiError } from "@/redux/api/util";

// Check if required environment variables are defined
if (
  !process.env.AWS_REGION ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_S3_BUCKET_NAME
) {
  throw new Error("Missing required AWS credentials in environment variables");
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// GET route to get all projects — Dashboard
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({
        status: 400,
        message: "userId is required",
      });
    }

    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      include: { deployments: true },
    });
    return NextResponse.json({ status: 200, project: projects });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

// POST route to create a new project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subDomain = generateSlug();
    const validatedData = ProjectModel.safeParse({ ...body, subDomain });

    if (!validatedData.success) {
      return NextResponse.json({
        status: 400,
        message: "Invalid request data",
        errors: validatedData.error.flatten().fieldErrors,
      });
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
    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

// PATCH route to update sub-domain
export async function PATCH(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const deploymentId = req.nextUrl.searchParams.get("deploymentId");
    const { newSubDomain } = await req.json();

    if (!projectId || !deploymentId) {
      return NextResponse.json({
        status: 400,
        message: "Project ID and deployment ID are required",
      });
    }

    if (!newSubDomain) {
      return NextResponse.json({
        status: 400,
        message: "newSubDomain is required in request body",
      });
    }

    // Get the existing project
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return NextResponse.json({ status: 404, message: "Project not found" });
    }

    const oldSubDomain = existingProject.subDomain;

    // Only proceed if the subdomain is actually different
    if (oldSubDomain === newSubDomain) {
      return NextResponse.json({
        status: 200,
        message: "New subdomain is same as current subdomain",
        project: existingProject,
      });
    }

    const oldPrefix = `__outputs/${oldSubDomain}/`;
    const newPrefix = `__outputs/${newSubDomain}/`;

    // Copy all objects with new prefix
    async function copyFolder(
      bucketName: string,
      sourcePrefix: string,
      targetPrefix: string
    ) {
      let isTruncated = true;
      let continuationToken: string | undefined;

      while (isTruncated) {
        const listParams = {
          Bucket: bucketName,
          Prefix: sourcePrefix,
          ContinuationToken: continuationToken,
        };

        const listedObjects = await s3Client.send(
          new ListObjectsV2Command(listParams)
        );

        if (listedObjects.Contents?.length) {
          // Copy each object with new prefix
          for (const object of listedObjects.Contents) {
            if (!object.Key) continue;

            const newKey = object.Key.replace(sourcePrefix, targetPrefix);
            await s3Client.send(
              new CopyObjectCommand({
                Bucket: bucketName,
                CopySource: `${bucketName}/${object.Key}`,
                Key: newKey,
              })
            );
          }

          // Delete old objects
          const deleteParams = {
            Bucket: bucketName,
            Delete: {
              Objects: listedObjects.Contents.map((item) => ({
                Key: item.Key,
              })),
            },
          };
          await s3Client.send(new DeleteObjectsCommand(deleteParams));
        }

        isTruncated = listedObjects.IsTruncated || false;
        continuationToken = listedObjects.NextContinuationToken;
      }
    }

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
      return NextResponse.json({
        status: 404,
        message: "Deployment not found",
      });
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
    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
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
      return NextResponse.json({
        status: 400,
        message: "projectId is required",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true },
    });

    if (!project) {
      return NextResponse.json({ status: 404, message: `Project not found` });
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

    // Function to delete all objects under the S3 prefix
    async function deleteFolder(bucketName: string, prefix: string) {
      let isTruncated = true;
      let continuationToken: string | undefined;

      while (isTruncated) {
        const listParams: any = {
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        };
        const listedObjects = await s3Client.send(
          new ListObjectsV2Command(listParams)
        );

        if (listedObjects.Contents?.length) {
          const deleteParams = {
            Bucket: bucketName,
            Delete: {
              Objects: listedObjects.Contents.map((item) => ({
                Key: item.Key,
              })),
            },
          };
          await s3Client.send(new DeleteObjectsCommand(deleteParams));
        }

        isTruncated = listedObjects.IsTruncated || false;
        continuationToken = listedObjects.NextContinuationToken;
      }
    }

    // Delete folder from S3
    await deleteFolder(process.env.AWS_S3_BUCKET_NAME!, folderPrefix);

    return NextResponse.json({
      status: 200,
      message: `Project and S3 folder deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
