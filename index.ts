import axios from "axios";
import * as fs from "fs";
import { Command } from "commander";
import { intro, outro, text, confirm, spinner, isCancel } from "@clack/prompts";
import { Repository, SortOption } from "./types";

// Initialize commander
const program = new Command();

program
  .name("github-fetcher")
  .description("CLI tool to fetch GitHub user repositories")
  .version("1.0.0")
  .option("-U, --user <username>", "GitHub username")
  .option(
    "-t, --token <token>",
    "GitHub personal access token (for private repos)"
  )
  .option("-f, --file <filename>", "Write output to file")
  .option(
    "-s, --sort <type>",
    "Sort repositories by: updated, created, stars, name",
    "updated"
  )
  .parse(process.argv);

const options = program.opts();

// Function to fetch GitHub profile info
async function fetchGitHubInfo(username: string): Promise<string> {
  const s = spinner();
  try {
    s.start("Fetching repositories...");

    // Setup axios config with auth token if provided
    const config = options.token
      ? {
          headers: {
            Authorization: `token ${options.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      : {};

    // Fetching all repositories with pagination
    let page = 1;
    let allRepos: Repository[] = [];
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await axios.get<Repository[]>(
        `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`,
        config
      );
      const repos = response.data;

      if (repos.length === 0) {
        hasMorePages = false;
      } else {
        allRepos = [...allRepos, ...repos];
        page++;
      }
    }

    let repos = allRepos;

    // Sort repositories based on option
    const sortType = options.sort as SortOption;
    repos = repos.sort((a, b) => {
      switch (sortType) {
        case "updated":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        case "created":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "stars":
          return b.stargazers_count - a.stargazers_count;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
      }
    });

    s.stop("Repositories fetched successfully!");

    // Creating the output string
    let output = `GitHub Profile: https://github.com/${username}\nRepositories:\n`;

    repos.forEach((repo) => {
      output += `\n- ${repo.name} (${repo.stargazers_count} stars) [${
        repo.private ? "Private" : "Public"
      }]\n`;
      output += `  Description: ${
        repo.description || "No description provided"
      }\n`;
      output += `  URL: ${repo.homepage || repo.html_url}\n`;
      output += `  Language: ${repo.language || "Not specified"}\n`;
      output += `  Created At: ${repo.created_at}\n`;
      output += `  Updated At: ${repo.updated_at}\n`;
    });

    return output;
  } catch (error) {
    s.stop("Failed to fetch repositories!");
    if (error instanceof Error) {
      throw new Error(`Error fetching GitHub information: ${error.message}`);
    }
    throw error;
  }
}

async function main() {
  try {
    intro("GitHub Repository Fetcher 🚀");

    let username = options.user;

    // If no username is provided, prompt for it
    if (!username) {
      username = await text({
        message: "Enter a GitHub username:",
        placeholder: "octocat",
        validate: (value) => {
          if (!value) return "Username is required!";
          if (value.includes("/"))
            return "Please enter just the username, not a full URL";
        },
      });

      if (isCancel(username)) {
        outro("Operation cancelled");
        process.exit(0);
      }
    }

    const output = await fetchGitHubInfo(username);

    // If file option is not provided, ask if user wants to save to file
    let shouldSaveToFile = options.file;
    if (!shouldSaveToFile) {
      const saveToFile = await confirm({
        message: "Would you like to save the output to a file?",
      });

      if (isCancel(saveToFile)) {
        outro("Operation cancelled");
        process.exit(0);
      }

      shouldSaveToFile = saveToFile;
    }

    // Handle file output
    if (shouldSaveToFile) {
      let filename = typeof options.file === "string" ? options.file : null;

      if (!filename) {
        const result = await text({
          message: "Enter filename to save to:",
          placeholder: "profile.txt",
          validate: (value) => {
            if (!value) return "Filename is required!";
          },
        });

        if (isCancel(result)) {
          outro("Operation cancelled");
          process.exit(0);
        }

        filename = result as string;
      }

      fs.writeFileSync(filename, output);
      outro(`Profile information written to ${filename} ✨`);
    } else {
      // Otherwise, print to console
      console.log("\n" + output);
      outro("Done! ✨");
    }
  } catch (error) {
    if (error instanceof Error) {
      outro(error.message);
    }
    process.exit(1);
  }
}

main();
