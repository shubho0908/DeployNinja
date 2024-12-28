import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/redux/api/util";

/**
 * Handles logging in a user. If the user does not exist in the database, creates the user.
 * If the user exists, updates the existing user with the latest information from
 * the GitHub API.
 *
 * @returns {Promise<NextResponse>} A promise that resolves to the response.
 * @throws {Error} If authentication fails or if there is an error
 *   fetching the user from the database.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.username) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: session.username },
    });

    if (existingUser) {
      return await updateExistingUser(existingUser, session);
    }

    return await createNewUser(session);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to login",
      },
      { status: 500 }
    );
  }
}

/**
 * Updates the existing user in the database with the latest session information.
 *
 * This function compares the current session data with the existing user data
 * and updates the user in the database if there are any differences.
 *
 * @param {any} existingUser - The existing user object from the database.
 * @param {any} session - The current session object containing user information.
 * @returns {Promise<NextResponse>} - A promise that resolves to a response indicating
 *   that the user already exists and has been updated successfully.
 * @throws {Error} - If there is an error during the update process.
 */

async function updateExistingUser(existingUser: any, session: any) {
  try {
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
  } catch (error) {
    throw new Error(await handleApiError(error));
  }
}

/**
 * Creates a new user in the database.
 *
 * @param {any} session - The session object containing the user's information.
 * @returns {Promise<NextResponse>} - A promise that resolves to a response indicating
 *   that the user was created successfully and the user object.
 * @throws {Error} - If there is an error during the creation process.
 */
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
