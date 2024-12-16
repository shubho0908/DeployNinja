import { NextResponse, NextRequest } from "next/server";
import { fetchGitUserRepositories } from "@/utils/github";

export async function GET(req: NextRequest) {
  try {
    // Extract the access token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token missing or invalid" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.split(" ")[1];
    const username = req.nextUrl.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username query parameter is required" },
        { status: 400 }
      );
    }

    // Pass the access token to fetch repositories
    const repositories = await fetchGitUserRepositories(accessToken);
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
