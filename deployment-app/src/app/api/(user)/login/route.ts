import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/redux/api/util";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.username) {
      throw new Error(await handleApiError("User not authenticated"));
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: session.username },
    });

    if (existingUser) {
      return await updateExistingUser(existingUser, session);
    }

    return await createNewUser(session);
  } catch (error) {
    throw new Error(await handleApiError(error));
  }
}

async function updateExistingUser(existingUser: any, session: any) {
  const updates = {
    ...(session?.user?.name !== existingUser.name && {
      name: session.user.name,
    }),
    ...(session?.username !== existingUser.username && {
      username: session.username,
    }),
    ...(session?.user?.image !== existingUser.profileImage && {
      profileImage: session.user.image,
    }),
    ...(session?.accessToken !== existingUser.githubAccessToken && {
      githubAccessToken: session.accessToken,
    }),
  };

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: updates,
    });
  }

  return NextResponse.json(
    { message: "User already exists", user: existingUser },
    { status: 200 }
  );
}

async function createNewUser(session: any) {
  const user = await prisma.user.create({
    data: {
      name: session.user.name,
      username: session.username,
      profileImage: session.user.image,
      isGithubConnected: true,
      githubAccessToken: session.accessToken,
    },
  });

  return NextResponse.json({ message: "Logged in successfully", user });
}
