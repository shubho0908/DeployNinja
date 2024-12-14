import { Octokit } from "@octokit/rest";
import { z } from "zod";

// Schema definitions
const GitResponseSchema = z.object({
  latestCommit: z.string(),
  message: z.string().optional(),
});

// Types
const GitRepoParamsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string(),
});

const FetchGitInfoParamsSchema = z.object({
  repoUrl: z.string(),
  branch: z.string(),
});

type GitRepoParams = z.infer<typeof GitRepoParamsSchema>;
export type FetchGitInfoParams = z.infer<typeof FetchGitInfoParamsSchema>;
type GitResponse = z.infer<typeof GitResponseSchema>;

// Constants
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Utility functions
function parseGitUrl(url: string, branch: string): GitRepoParams | null {
  const parts = url.split("/");
  if (parts.length < 5) return null;

  return {
    owner: parts[3],
    repo: parts[4].replace(".git", ""),
    branch,
  };
}

export async function fetchGitLatestCommit({
  repoUrl,
  branch,
}: FetchGitInfoParams): Promise<GitResponse> {
  if (!GITHUB_TOKEN) {
    throw new Error("GitHub token not configured");
  }

  if (!repoUrl) {
    throw new Error("Repository URL is required");
  }

  const repoParams = parseGitUrl(repoUrl, branch);
  if (!repoParams) {
    throw new Error("Invalid repository URL format");
  }

  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const { data } = await octokit.repos.getBranch({
      ...repoParams,
      branch,
    });

    const response: GitResponse = {
      latestCommit: data.commit.sha,
      message: data.commit.commit.message,
    };

    return GitResponseSchema.parse(response);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`GitHub API Error: ${error.message}`);
    }
    throw new Error("Failed to fetch repository data");
  }
}

const GithubRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable(),
  private: z.boolean(),
  default_branch: z.string(),
  updated_at: z.string().datetime(),
});

const GithubRepositoriesResponseSchema = z.array(GithubRepositorySchema);

type GithubRepository = z.infer<typeof GithubRepositorySchema>;

export async function fetchGitUserRepositories(
  username: string
): Promise<GithubRepository[]> {
  if (!GITHUB_TOKEN) {
    throw new Error("GitHub token not configured");
  }

  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const repositories: GithubRepository[] = [];
    let page = 1;

    while (true) {
      const { data } = await octokit.repos.listForUser({
        username,
        type: "all",
        sort: "updated",
        direction: "desc",
        per_page: 100,
        page,
      });

      if (data.length === 0) break;

      const validatedData = GithubRepositoriesResponseSchema.parse(
        data.map((repo) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          html_url: repo.html_url,
          description: repo.description,
          private: repo.private,
          default_branch: repo.default_branch,
          updated_at: repo.updated_at,
        }))
      );

      repositories.push(...validatedData);

      if (data.length < 100) break;
      page++;
    }

    return repositories;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Data validation error: ${error.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`GitHub API Error: ${error.message}`);
    }
    throw new Error("Failed to fetch repository data");
  }
}
