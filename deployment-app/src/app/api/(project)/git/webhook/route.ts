import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchGitLatestCommit } from "@/utils/github";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { API } from "@/redux/api/util";

/**
 * Verifies the GitHub webhook payload using the HMAC SHA-256 algorithm.
 * 
 * This function checks the 'x-hub-signature-256' header from the incoming request
 * against a computed HMAC digest to ensure the payload's integrity and authenticity.
 *
 * @param {NextRequest} req - The incoming HTTP request object containing headers.
 * @param {string} payload - The raw payload string to verify.
 * @returns {boolean} - Returns true if the payload is verified successfully, false otherwise.
 * 
 * @throws {Error} - Logs an error if the GitHub signature header or webhook secret is missing.
 */

function verifyGitHubWebhook(req: NextRequest, payload: string): boolean {
  const githubSignatureHeader = req.headers.get("x-hub-signature-256");

  if (!githubSignatureHeader) {
    console.error("No GitHub signature header found");
    return false;
  }

  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.error("GitHub webhook secret is not set");
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(githubSignatureHeader)
  );
}

/**
 * Handles incoming POST requests for GitHub webhook events.
 * 
 * This function processes GitHub webhook payloads, verifies their authenticity,
 * and triggers deployments for push events. It checks the signature of the payload,
 * extracts necessary information about the repository and branch, and sends a deployment
 * request if the event type is a push. The deployment process involves fetching the latest
 * commit and preparing a payload that includes project and environment details.
 *
 * @param {NextRequest} req - The incoming HTTP request object containing the webhook payload.
 * @returns {Promise<NextResponse>} - A promise resolving to the HTTP response indicating
 *                                    the result of the webhook processing.
 * @throws {Error} - If an error occurs during processing, including unauthorized access,
 *                   missing project data, or failed deployment requests.
 */

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const projectId = req.nextUrl.searchParams.get("projectId");
    const eventType = req.headers.get("X-GitHub-Event");

    const projectData = await prisma.project.findUnique({
      where: { id: projectId! },
      include: { owner: true },
    });

    const accessToken = projectData?.owner?.githubAccessToken;

    if (!accessToken || !verifyGitHubWebhook(req, payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = JSON.parse(payload);

    console.log("Webhook event", eventType);

    if (eventType !== "push") {
      return NextResponse.json({ status: 400, message: "Not a push event" });
    }

    // Extract repository and branch information
    const repoUrl = body.repository.clone_url;
    const branchName = body.ref.replace("refs/heads/", "");
    const commitHash = body.after;

    // Find the specific project matching the repo URL and project ID
    const project = await prisma.project.findUnique({
      where: {
        id: projectId!,
      },
      include: {
        deployments: true,
      },
    });

    if (!project) {
      console.log("No project found for the push event");
      return NextResponse.json(
        { error: "No matching project found" },
        { status: 404 }
      );
    }

    console.log("Preparing deployment payload...");

    // Fetch the latest commit to ensure we're using the most recent information
    await fetchGitLatestCommit({
      accessToken,
      repoUrl,
      branch: branchName,
    });

    // Prepare deployment payload
    const deploymentPayload = {
      projectId: project.id,
      gitBranchName: branchName,
      gitRepoUrl: repoUrl,
      gitCommitHash: commitHash,
      buildCommand: project?.buildCommand || "npm run build",
      installCommand: project?.installCommand || "npm install",
      projectRootDir: project?.projectRootDir || "./",
      deploymentStatus: "IN_PROGRESS" as DeploymentStatus,
      environmentVariables: project.deployments[0]?.environmentVariables || {},
    };

    // Send deployment request to existing deployment endpoint
    console.log("Sending deployment request...");

    const deployResponse = await API.post(`/deploy`, deploymentPayload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Request-Maker": "webhook",
      },
    });

    const deployResult = await deployResponse.data;

    // Log deployment result
    console.log(
      `Deployment triggered for project ${project.id}:`,
      JSON.stringify(deployResult)
    );

    return NextResponse.json({
      status: 200,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.log("Webhook processing error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}
