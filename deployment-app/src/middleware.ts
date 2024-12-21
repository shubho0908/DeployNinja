import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/git/webhook',
  '/api/deploy',
  '/api/login',
  '/api/auth'
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip auth for public routes
  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check auth for all other API routes
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};