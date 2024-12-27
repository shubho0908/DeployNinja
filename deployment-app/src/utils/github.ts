import { Octokit } from "@octokit/rest";
import { z } from "zod";

// Schema definitions
const GitResponseSchema = z.object({
  latestCommit: z.string(),
  message: z.string().optional(),
});

const GitRepoParamsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string(),
});

const FetchGitInfoParamsSchema = z.object({
  accessToken: z.string(),
  repoUrl: z.string(),
  branch: z.string(),
});

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
type GitRepoParams = z.infer<typeof GitRepoParamsSchema>;
export type FetchGitInfoParams = z.infer<typeof FetchGitInfoParamsSchema>;
type GitResponse = z.infer<typeof GitResponseSchema>;

// Utility functions
/**
 * Parses a Git repository URL to extract owner, repository name, and branch.
 * @param url The Git repository URL.
 * @param branch The branch name to be used.
 * @returns An object containing the owner, repo, and branch if valid; otherwise, null.
 */
function parseGitUrl(url: string, branch: string): GitRepoParams | null {
  const parts = url.split("/");
  if (parts.length < 5) return null;

  const owner = parts[3];
  const repo = parts[4].replace(".git", "");

  const validatedData = GitRepoParamsSchema.safeParse({
    owner,
    repo,
    branch,
  });

  if (!validatedData.success) return null;

  return {
    owner,
    repo,
    branch,
  };
}

/**
 * Fetches the latest commit information for a given Git repository.
 * @param {FetchGitInfoParams} params Object containing the required parameters.
 * @param {string} params.accessToken A GitHub Personal Access Token with the "repo" scope.
 * @param {string} params.repoUrl The URL of the Git repository.
 * @param {string} params.branch The branch name to fetch the latest commit for.
 * @returns {Promise<GitResponse>} A promise resolving to an object containing the latest commit SHA and message.
 * @throws {Error} If the GitHub token is not configured.
 * @throws {Error} If the repository URL is in an invalid format.
 * @throws {Error} If the GitHub API request fails.
 */
export async function fetchGitLatestCommit({
  accessToken,
  repoUrl,
  branch,
}: FetchGitInfoParams): Promise<GitResponse> {
  if (!accessToken) {
    throw new Error("GitHub token not configured");
  }

  const validatedData = FetchGitInfoParamsSchema.safeParse({
    accessToken,
    repoUrl,
    branch,
  });

  if (!validatedData.success) {
    throw new Error("Invalid repository URL format");
  }

  const repoParams = parseGitUrl(repoUrl, branch);
  if (!repoParams) {
    throw new Error("Invalid repository URL format");
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
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

/**
 * Fetch a list of repositories that a user has access to.
 * @param accessToken a GitHub Personal Access Token with the "read:user" and "repo" scopes
 * @returns a list of {@link GithubRepository} objects
 */
export async function fetchGitUserRepositories(
  accessToken: string
): Promise<GithubRepository[]> {
  if (!accessToken) {
    throw new Error("Access token not provided");
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
    const repositories: GithubRepository[] = [];
    let page = 1;

    while (true) {
      const { data } = await octokit.request("GET /user/repos", {
        type: "public",
        sort: "updated",
        direction: "desc",
        per_page: 100,
        page,
      });

      // Break loop if no more repositories
      if (data.length === 0) break;

      // Validate repository data
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

      // Exit if fewer than 100 items are returned, indicating the last page
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
