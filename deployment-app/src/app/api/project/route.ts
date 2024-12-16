import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProjectModel } from "@/types/models/Project.model";

// GET route to get all projects — Dashboard
export async function GET() {
  try {
    const projects = await prisma.project.findMany();
    return NextResponse.json({ status: 200, data: projects });
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
    const validatedData = ProjectModel.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({
        status: 400,
        message: "Invalid request data",
        errors: validatedData.error.flatten().fieldErrors,
      });
    }

    const { name, ownerId, framework } = validatedData.data;
    const project = await prisma.project.create({
      data: { name, ownerId, framework: framework.name },
    });

    return NextResponse.json({ status: 200, data: project });
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
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({
        status: 400,
        message: "projectId is required",
      });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({
      status: 200,
      message: `Project with id ${projectId} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
