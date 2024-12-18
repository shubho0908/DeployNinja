import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const isUserExists = await prisma.user.findFirst({
      where: { username: session?.username! },
    });

    if (isUserExists) {
      return NextResponse.json(
        { message: "User already exists", user: isUserExists },
        { status: 200 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: session?.user?.name!,
        username: session?.username!,
        profileImage: session?.user?.image!,
        isGithubConnected: true,
        githubAccessToken: session.accessToken!,
      },
    });

    return NextResponse.json({ message: "Logged in successfully", user });
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
