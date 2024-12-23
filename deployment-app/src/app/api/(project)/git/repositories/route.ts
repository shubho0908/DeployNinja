import { NextResponse, NextRequest } from "next/server";
import { fetchGitUserRepositories } from "@/utils/github";
import { handleApiError } from "@/redux/api/util";

export async function GET(req: NextRequest) {
  try {
    // Extract the access token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error(
        await handleApiError("Authorization token missing or invalid")
      );
    }

    const accessToken = authHeader.split(" ")[1];
    const username = req.nextUrl.searchParams.get("username");

    if (!username) {
      throw new Error(
        await handleApiError("Username query parameter is required")
      );
    }

    // Pass the access token to fetch repositories
    const repositories = await fetchGitUserRepositories(accessToken);
    return NextResponse.json(repositories);
  } catch (error) {
    throw new Error(await handleApiError(error));
  }
}
