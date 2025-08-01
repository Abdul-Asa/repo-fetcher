import { Octokit } from "octokit";
import { Command } from "commander";
import { intro, outro, text, select, spinner } from "@clack/prompts";
import * as fs from "fs/promises";

const program = new Command();

program
  .name("github-cli")
  .description("CLI tool to fetch and edit GitHub repositories using Octokit")
  .version("1.0.0")
  .option("-t, --token <token>", "GitHub personal access token")
  .option("-u, --user <username>", "GitHub username")
  .option(
    "-s, --sort <sort>",
    "Sort repositories by (updated, created, pushed, name)"
  )
  .option(
    "-f, --file <filename>",
    "Output filename for repositories (.txt or .json)"
  )
  .parse(process.argv);

const options = program.opts();

// Pure function to initialize Octokit
async function initializeOctokit(token?: string): Promise<Octokit> {
  return new Octokit({
    auth: token,
  });
}

// Pure function to authenticate and get user info
async function authenticateUser(octokit: Octokit): Promise<string> {
  const { data: user } = await octokit.rest.users.getAuthenticated();
  console.log(`\n👋 Authenticated as: ${user.login}`);
  return user.login;
}

// Format repositories as text
function formatAsText(repos: any[], username: string): string {
  let content = `GitHub Profile: https://github.com/${username}\n`;
  content += `Username: ${username}\n`;
  content += `Total Repositories: ${repos.length}\n`;
  content += `Public Repositories: ${
    repos.filter((repo) => !repo.private).length
  }\n`;
  content += `Private Repositories: ${
    repos.filter((repo) => repo.private).length
  }\n\n`;
  content += `Repositories:\n\n`;

  repos.forEach((repo) => {
    content += `- ${repo.name} (${repo.stargazers_count} stars, ${repo.forks_count} forks)\n`;
    content += `  Description: ${
      repo.description || "No description provided"
    }\n`;
    content += `  Language: ${repo.language || "Not specified"}\n`;
    content += `  Private: ${repo.private ? "Yes" : "No"}\n`;
    if (repo.homepage) {
      content += `  Homepage: ${repo.homepage}\n`;
    }
    content += `  Repository URL: ${repo.html_url}\n`;
    content += `  Created At: ${repo.created_at}\n`;
    content += `  Updated At: ${repo.updated_at}\n`;
    content += `  Last Push: ${repo.pushed_at}\n\n`;
  });

  return content;
}

// Format repositories as JSON
function formatAsJson(repos: any[], username: string): string {
  const data = {
    profile: `https://github.com/${username}`,
    username: username,
    total_repositories: repos.length,
    public_repositories: repos.filter((repo) => !repo.private).length,
    private_repositories: repos.filter((repo) => repo.private).length,
    repositories: repos.map((repo) => ({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      private: repo.private,
      homepage: repo.homepage,
      repository_url: repo.html_url,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
    })),
  };

  return JSON.stringify(data, null, 2);
}

// Pure function to write repositories to file
async function writeRepositoriesToFile(
  repos: any[],
  username: string,
  filename: string
): Promise<void> {
  const s = spinner();
  s.start(`Writing repositories to ${filename}...`);

  try {
    const extension = filename.toLowerCase().split(".").pop();
    let content: string;

    switch (extension) {
      case "json":
        content = formatAsJson(repos, username);
        break;
      case "txt":
      default:
        content = formatAsText(repos, username);
        break;
    }

    await fs.writeFile(filename, content, "utf8");
    s.stop(
      `✅ Successfully wrote ${repos.length} repositories to ${filename} (${
        extension?.toUpperCase() || "TXT"
      } format)`
    );
  } catch (error) {
    s.stop(`❌ Failed to write to ${filename}`);
    throw error;
  }
}

// Pure function to fetch repositories
async function fetchRepositories(
  octokit: Octokit,
  username: string,
  isAuthenticated: boolean,
  sort: "updated" | "created" | "pushed" | "full_name" = "updated"
) {
  const s = spinner();
  s.start("Fetching repositories...");

  try {
    let repos;

    if (isAuthenticated) {
      // Fetch authenticated user's repositories (including private)
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 100,
        sort,
        direction: "desc",
        type: "owner",
      });
      repos = data;
    } else {
      // Fetch public repositories for specified user
      const { data } = await octokit.rest.repos.listForUser({
        username,
        per_page: 100,
        sort,
        direction: "desc",
        type: "all",
      });
      repos = data;
    }

    s.stop("Repositories fetched successfully!");

    const publicCount = repos.filter((repo) => !repo.private).length;
    const privateCount = repos.length - publicCount;

    const repoType = isAuthenticated ? "(including private)" : "(public only)";
    console.log(
      `\n📊 Found ${repos.length} repositories ${repoType} - ${publicCount} public, ${privateCount} private for ${username}`
    );

    return repos;
  } catch (error) {
    s.stop("Failed to fetch repositories!");
    throw error;
  }
}

async function main() {
  try {
    intro("🚀 GitHub CLI Tool with Octokit");

    // Step 1: Get token (from options, environment, or prompt - optional)
    let token = options.token;

    if (token) {
      console.log("🔑 Using GitHub token from program options");
    }

    // Check environment variables for GitHub token
    if (!token) {
      token = process.env.GITHUB_ACCESS_TOKEN;

      if (token) {
        console.log("🔑 Using GitHub token from environment variable");
      }
    }

    if (!token) {
      token = await text({
        message:
          "Enter your GitHub personal access token (optional for public repos):",
        placeholder: "github_pat_...",
      });

      // Allow empty token for public access
      if (!token || token.trim() === "") {
        token = undefined;
      }
    }

    // Step 2: Initialize Octokit
    const octokit = await initializeOctokit(token);

    // Step 3: Get username
    let username: string;
    let isAuthenticated = false;

    if (token) {
      // If token provided, authenticate and get username automatically
      try {
        username = await authenticateUser(octokit);
        isAuthenticated = true;
      } catch (error) {
        console.warn(
          "\n⚠️  Warning: Invalid token, falling back to unauthenticated access"
        );
        // Fall back to asking for username
        username = (await text({
          message: "Enter GitHub username:",
          placeholder: "octocat",
        })) as string;
      }
    } else {
      // If no token, ask for username (required)
      username = options.user;
      if (!username) {
        username = (await text({
          message: "Enter GitHub username:",
          placeholder: "octocat",
          validate: (value) => {
            if (!value || value.trim() === "") {
              return "Username is required";
            }
          },
        })) as string;
      }
    }

    // Ensure username is valid
    if (!username || username.trim() === "") {
      throw new Error("Username is required");
    }

    // Step 4: Show action selection
    const action = await select({
      message: "What would you like to do?",
      options: [
        {
          value: "fetch-repositories",
          label: "Fetch repositories",
        },
      ],
    });

    // Step 5: Execute selected action
    switch (action) {
      case "fetch-repositories":
        const sort = options.sort;
        const repos = await fetchRepositories(
          octokit,
          username,
          isAuthenticated,
          sort
        );

        // Get filename for output
        let filename = options.file;
        if (!filename) {
          filename = (await text({
            message: "Enter filename for output (supports .txt and .json):",
            placeholder: "repositories.txt",
            defaultValue: "repositories.txt",
          })) as string;

          // Use default if empty
          if (!filename || filename.trim() === "") {
            filename = "repositories.txt";
          }
        }

        // Write repositories to file
        await writeRepositoriesToFile(repos, username, filename);
        break;

      default:
        outro("Invalid action");
        process.exit(0);
    }

    outro("Done! ✨");
  } catch (error) {
    if (error instanceof Error) {
      outro(`❌ Error: ${error.message}`);
    } else {
      outro("❌ An unknown error occurred");
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
