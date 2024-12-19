import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Get the path
  const path = request.nextUrl.pathname;

  // Skip auth check for webhook route
  if (path.startsWith('/api/git/webhook') || path.startsWith('/api/deploy')) {
    return NextResponse.next();
  }

  // Handle other API routes that require session auth
  if (path.startsWith('/api')) {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};