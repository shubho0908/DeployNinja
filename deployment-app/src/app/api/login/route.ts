import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await prisma.user.create({
      data: {
        name: session?.user?.name!,
        username: session?.username!,
        email: session?.user?.email!,
        profileImage: session?.user?.image!,
        isGithubConnected: true,
        githubAccessToken: session.accessToken,
      },
    });

    return NextResponse.json({ message: "Logged in successfully" });
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
