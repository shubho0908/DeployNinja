import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { detectFrontendFramework } from "@/utils/detectFramework";

const RequestSchema = z.object({
  repoUrl: z.string().url(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const repoUrl = searchParams.get("repoUrl");

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repo URL is required" },
        { status: 400 }
      );
    }

    const schema = RequestSchema.parse({ repoUrl });

    const framework = await detectFrontendFramework(schema.repoUrl);

    return NextResponse.json(framework);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
