import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const subDomain = req.nextUrl.searchParams.get("subDomain");

    if (!projectId || !subDomain) {
      return NextResponse.json({
        status: 400,
        message: "projectId and subDomain are required",
      });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        subDomain,
      },
    });

    return NextResponse.json({ status: 200, project: project, message: "Subdomain updated successfully" });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
