import { Octokit } from "octokit";
import { Command } from "commander";
import { intro, outro, text, select, spinner } from "@clack/prompts";

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
        visibility: "all",
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

    const privateCount = repos.filter((repo) => repo.private).length;
    const publicCount = repos.length - privateCount;

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

    // Step 1: Get token (from options or prompt - optional)
    let token = options.token;
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
        const sort =
          (options.sort as "updated" | "created" | "pushed" | "full_name") ||
          "updated";
        const repos = await fetchRepositories(
          octokit,
          username,
          isAuthenticated,
          sort
        );
        console.log(`\n✅ Total repositories: ${repos.length}`);
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
