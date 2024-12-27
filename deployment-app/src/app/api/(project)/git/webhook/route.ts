import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchGitLatestCommit } from "@/utils/github";
import { DeploymentStatus } from "@/types/enums/deploymentStatus.enum";
import { API } from "@/redux/api/util";

// Verify GitHub webhook signature
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
