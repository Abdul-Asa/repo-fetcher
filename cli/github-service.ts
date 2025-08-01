import { Octokit } from "octokit";
import { spinner } from "@clack/prompts";
import {
  GitHubRepository,
  GitHubUser,
  SortOption,
  RepositoryUpdateData,
  AuthenticationResult,
} from "./types.js";

export class GitHubService {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Authenticate and get user information
   */
  async authenticateUser(): Promise<GitHubUser> {
    const { data: user } = await this.octokit.rest.users.getAuthenticated();
    console.log(`\n👋 Authenticated as: ${user.login}`);
    return user as GitHubUser;
  }

  /**
   * Get user authentication status and username
   */
  async getAuthenticationInfo(token?: string): Promise<AuthenticationResult> {
    if (!token) {
      return { username: "", isAuthenticated: false };
    }

    try {
      const user = await this.authenticateUser();
      return { username: user.login, isAuthenticated: true };
    } catch (error) {
      console.warn(
        "\n⚠️  Warning: Invalid token, falling back to unauthenticated access"
      );
      return { username: "", isAuthenticated: false };
    }
  }

  /**
   * Fetch repositories for authenticated user or specific user
   */
  async fetchRepositories(
    username: string,
    isAuthenticated: boolean,
    sort: SortOption = "updated"
  ): Promise<GitHubRepository[]> {
    const s = spinner();
    s.start("Fetching repositories...");

    try {
      let repos: GitHubRepository[];

      if (isAuthenticated) {
        // Fetch authenticated user's repositories (including private)
        const { data } = await this.octokit.rest.repos.listForAuthenticatedUser(
          {
            per_page: 100,
            sort,
            direction: "desc",
            type: "owner",
          }
        );
        repos = data as GitHubRepository[];
      } else {
        // Fetch public repositories for specified user
        const { data } = await this.octokit.rest.repos.listForUser({
          username,
          per_page: 100,
          sort,
          direction: "desc",
          type: "all",
        });
        repos = data as GitHubRepository[];
      }

      s.stop("Repositories fetched successfully!");

      const publicCount = repos.filter((repo) => !repo.private).length;
      const privateCount = repos.length - publicCount;

      const repoType = isAuthenticated
        ? "(including private)"
        : "(public only)";
      console.log(
        `\n📊 Found ${repos.length} repositories ${repoType} - ${publicCount} public, ${privateCount} private for ${username}`
      );

      return repos;
    } catch (error) {
      s.stop("Failed to fetch repositories!");
      throw error;
    }
  }

  /**
   * Update repository metadata
   */
  async updateRepository(
    owner: string,
    repo: string,
    updateData: RepositoryUpdateData
  ): Promise<GitHubRepository> {
    const s = spinner();
    s.start(`Updating repository ${owner}/${repo}...`);

    try {
      const { data } = await this.octokit.rest.repos.update({
        owner,
        repo,
        ...updateData,
      });

      s.stop(`✅ Successfully updated ${owner}/${repo}`);
      return data as GitHubRepository;
    } catch (error) {
      s.stop(`❌ Failed to update ${owner}/${repo}`);
      throw error;
    }
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });
      return data as GitHubRepository;
    } catch (error) {
      throw new Error(`Failed to fetch repository ${owner}/${repo}: ${error}`);
    }
  }

  /**
   * Batch update multiple repositories
   */
  async batchUpdateRepositories(
    updates: Array<{
      owner: string;
      repo: string;
      data: RepositoryUpdateData;
    }>
  ): Promise<Array<{ success: boolean; repo: string; error?: string }>> {
    const results: Array<{ success: boolean; repo: string; error?: string }> =
      [];

    console.log(
      `\n🔄 Starting batch update of ${updates.length} repositories...`
    );

    for (const update of updates) {
      try {
        await this.updateRepository(update.owner, update.repo, update.data);
        results.push({ success: true, repo: `${update.owner}/${update.repo}` });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.push({
          success: false,
          repo: `${update.owner}/${update.repo}`,
          error: errorMessage,
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `\n📊 Batch update completed: ${successful} successful, ${failed} failed`
    );

    return results;
  }

  /**
   * Find repositories with missing or broken descriptions/homepages
   */
  async findRepositoriesNeedingUpdate(
    repositories: GitHubRepository[]
  ): Promise<{
    missingDescription: GitHubRepository[];
    missingHomepage: GitHubRepository[];
    brokenHomepage: GitHubRepository[];
  }> {
    const s = spinner();
    s.start("Analyzing repositories for missing/broken metadata...");

    const missingDescription = repositories.filter(
      (repo) => !repo.description || repo.description.trim() === ""
    );

    const missingHomepage = repositories.filter(
      (repo) => !repo.homepage || repo.homepage.trim() === ""
    );

    // Simple check for potentially broken homepages (you might want to enhance this)
    const brokenHomepage = repositories.filter((repo) => {
      if (!repo.homepage) return false;

      // Basic checks for common issues
      const homepage = repo.homepage.toLowerCase();
      return (
        (!homepage.startsWith("http://") &&
          !homepage.startsWith("https://") &&
          !homepage.startsWith("www.")) ||
        homepage.includes("localhost") ||
        homepage.includes("127.0.0.1")
      );
    });

    s.stop("Repository analysis completed!");

    console.log(`\n🔍 Analysis results:`);
    console.log(
      `  - ${missingDescription.length} repositories missing descriptions`
    );
    console.log(`  - ${missingHomepage.length} repositories missing homepages`);
    console.log(
      `  - ${brokenHomepage.length} repositories with potentially broken homepages`
    );

    return {
      missingDescription,
      missingHomepage,
      brokenHomepage,
    };
  }
}
