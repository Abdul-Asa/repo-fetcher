import { Command } from "commander";
import { intro, outro, text, select } from "@clack/prompts";
import { GitHubService } from "./github-service.js";
import { writeRepositoriesToFile } from "./formatters.js";
import {
  editSingleRepository,
  batchEditRepositories,
  analyzeRepositories,
} from "./edit-workflows.js";
import { CLIOptions } from "./types.js";

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

const options = program.opts() as CLIOptions;

async function main() {
  try {
    intro("🚀 GitHub CLI Tool - Repository Manager");

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
      const tokenInput = await text({
        message:
          "Enter your GitHub personal access token (optional for public repos):",
        placeholder: "github_pat_...",
      });

      // Allow empty token for public access
      if (
        tokenInput &&
        typeof tokenInput === "string" &&
        tokenInput.trim() !== ""
      ) {
        token = tokenInput.trim();
      }
    }

    // Step 2: Initialize GitHub service
    const githubService = new GitHubService(token);

    // Step 3: Get authentication info and username
    const authInfo = await githubService.getAuthenticationInfo(token);
    let username = authInfo.username;

    if (!authInfo.isAuthenticated) {
      // If no token or invalid token, ask for username (required)
      username = options.user || "";
      if (!username) {
        const usernameInput = await text({
          message: "Enter GitHub username:",
          placeholder: "octocat",
          validate: (value) => {
            if (!value || value.trim() === "") {
              return "Username is required";
            }
          },
        });
        username = usernameInput as string;
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
          label: "📁 Fetch and export repositories",
        },
        {
          value: "analyze-repositories",
          label: "🔍 Analyze repositories for missing/broken metadata",
        },
        {
          value: "edit-single",
          label: "✏️  Edit a single repository",
          disabled: !authInfo.isAuthenticated,
          hint: !authInfo.isAuthenticated
            ? "Requires authentication"
            : undefined,
        },
        {
          value: "batch-edit",
          label: "🔧 Batch edit repositories",
          disabled: !authInfo.isAuthenticated,
          hint: !authInfo.isAuthenticated
            ? "Requires authentication"
            : undefined,
        },
      ],
    });

    // Step 5: Fetch repositories (common for all actions)
    const sort = options.sort || "updated";
    const repos = await githubService.fetchRepositories(
      username,
      authInfo.isAuthenticated,
      sort
    );

    // Step 6: Execute selected action
    switch (action) {
      case "fetch-repositories":
        // Get filename for output
        let filename = options.file;
        if (!filename) {
          const filenameInput = await text({
            message: "Enter filename for output (supports .txt, .json, .csv):",
            placeholder: "repositories.txt",
            defaultValue: "repositories.txt",
          });

          filename = filenameInput as string;
          // Use default if empty
          if (!filename || filename.trim() === "") {
            filename = "repositories.txt";
          }
        }

        // Write repositories to file
        await writeRepositoriesToFile(repos, username, filename);
        break;

      case "analyze-repositories":
        await analyzeRepositories(githubService, repos, username);
        break;

      case "edit-single":
        const repoToEdit = (await select({
          message: "Select repository to edit:",
          options: repos.map((repo) => ({
            value: repo.name,
            label: `${repo.name} (${repo.description || "No description"})`,
          })),
        })) as string;

        const selectedRepo = repos.find((r) => r.name === repoToEdit);
        if (selectedRepo) {
          await editSingleRepository(githubService, selectedRepo);
        }
        break;

      case "batch-edit":
        await batchEditRepositories(githubService, repos);
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
