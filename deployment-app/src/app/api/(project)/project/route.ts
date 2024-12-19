import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProjectModel } from "@/types/models/Project.model";
import { generateSlug } from "random-word-slugs";
import {
  S3Client,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

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

// DELETE route to delete a project
export async function DELETE(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ status: 400, message: "projectId is required" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      return NextResponse.json({ status: 404, message: `Project not found` });
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
        const listParams: any = { Bucket: bucketName, Prefix: prefix, ContinuationToken: continuationToken };
        const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));

        if (listedObjects.Contents?.length) {
          const deleteParams = {
            Bucket: bucketName,
            Delete: { Objects: listedObjects.Contents.map((item) => ({ Key: item.Key })) },
          };
          await s3Client.send(new DeleteObjectsCommand(deleteParams));
        }

        isTruncated = listedObjects.IsTruncated || false;
        continuationToken = listedObjects.NextContinuationToken;
      }
    }

    // Delete folder from S3
    await deleteFolder(process.env.AWS_S3_BUCKET_NAME!, folderPrefix);

    return NextResponse.json({ status: 200, message: `Project and S3 folder deleted successfully` });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}