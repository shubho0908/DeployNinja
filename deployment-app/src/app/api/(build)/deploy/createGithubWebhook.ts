import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/redux/api/util";
import { Octokit } from "@octokit/rest";

export async function createGitHubWebhook(
  projectId: string,
  repoUrl: string,
  secret: string,
  webhookUrl: string,
  accessToken: string
) {
  // GitHub API client
  const octokit = new Octokit({
    auth: accessToken,
  });

  const [owner, repo] = repoUrl.replace("https://github.com/", "").split("/");

  try {
    console.log("Checking if webhook already exists...");

    // Check if webhook already exists
    const { data: webhooks } = await octokit.request(
      "GET /repos/{owner}/{repo}/hooks",
      {
        owner,
        repo,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (webhooks.some((hook) => hook.config.url === webhookUrl)) {
      console.log("Webhook already exists for this repository.");
      return;
    } else {
      // Create webhook using direct request method
      const webhook = await octokit.request(
        "POST /repos/{owner}/{repo}/hooks",
        {
          owner,
          repo,
          config: {
            url: webhookUrl,
            secret,
            content_type: "json",
          },
          events: ["push"],
          active: true,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      await prisma.project.update({
        where: { id: projectId },
        data: { webhookId: webhook.data.id },
      });

      console.log("Webhook created successfully. ", webhook.data.id);
    }
  } catch (error) {
    throw new Error(await handleApiError(error));
  }
}
