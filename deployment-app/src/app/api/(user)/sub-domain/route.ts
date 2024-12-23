import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/redux/api/util";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const subDomain = req.nextUrl.searchParams.get("subDomain");

    if (!projectId || !subDomain) {
      throw new Error("projectId and subDomain are required");
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        subDomain,
      },
    });

    return NextResponse.json({
      status: 200,
      project: project,
      message: "Subdomain updated successfully",
    });
  } catch (error) {
    throw new Error(await handleApiError(error));
  }
}
