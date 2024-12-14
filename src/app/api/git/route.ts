import { NextResponse, NextRequest } from "next/server";
import { fetchGitUserRepositories } from "@/utils/github";

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username")!;
    const repositories = await fetchGitUserRepositories(username);
    return NextResponse.json(repositories);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
