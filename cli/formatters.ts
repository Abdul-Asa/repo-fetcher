import * as fs from "fs/promises";
import { spinner } from "@clack/prompts";
import {
  GitHubRepository,
  FormattedRepositoryData,
  FormattedRepository,
  OutputFormat,
} from "./types.js";

/**
 * Format repositories as plain text
 */
export function formatAsText(
  repos: GitHubRepository[],
  username: string
): string {
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

/**
 * Format repositories as JSON
 */
export function formatAsJson(
  repos: GitHubRepository[],
  username: string
): string {
  const data: FormattedRepositoryData = {
    profile: `https://github.com/${username}`,
    username: username,
    total_repositories: repos.length,
    public_repositories: repos.filter((repo) => !repo.private).length,
    private_repositories: repos.filter((repo) => repo.private).length,
    repositories: repos.map(
      (repo): FormattedRepository => ({
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
      })
    ),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Format repositories as CSV
 */
export function formatAsCsv(
  repos: GitHubRepository[],
  username: string
): string {
  const headers = [
    "Name",
    "Description",
    "Stars",
    "Forks",
    "Language",
    "Private",
    "Homepage",
    "Repository URL",
    "Created At",
    "Updated At",
    "Last Push",
  ];

  let content = `# GitHub Profile: https://github.com/${username}\n`;
  content += `# Total Repositories: ${repos.length}\n`;
  content += `# Public: ${repos.filter((r) => !r.private).length}, Private: ${
    repos.filter((r) => r.private).length
  }\n\n`;

  content += headers.join(",") + "\n";

  repos.forEach((repo) => {
    const row = [
      `"${repo.name}"`,
      `"${repo.description || ""}"`,
      repo.stargazers_count,
      repo.forks_count,
      `"${repo.language || ""}"`,
      repo.private ? "true" : "false",
      `"${repo.homepage || ""}"`,
      `"${repo.html_url}"`,
      `"${repo.created_at}"`,
      `"${repo.updated_at}"`,
      `"${repo.pushed_at}"`,
    ];
    content += row.join(",") + "\n";
  });

  return content;
}

/**
 * Format repositories for analysis report (text format)
 */
export function formatAnalysisReport(
  repos: GitHubRepository[],
  analysis: {
    missingDescription: GitHubRepository[];
    missingHomepage: GitHubRepository[];
    brokenHomepage: GitHubRepository[];
  },
  username: string
): string {
  let content = `Repository Analysis Report\n`;
  content += `==========================================\n\n`;
  content += `GitHub Profile: https://github.com/${username}\n`;
  content += `Total Repositories: ${repos.length}\n`;
  content += `Analysis Date: ${new Date().toISOString()}\n\n`;

  content += `SUMMARY:\n`;
  content += `- ${analysis.missingDescription.length} repositories missing descriptions\n`;
  content += `- ${analysis.missingHomepage.length} repositories missing homepages\n`;
  content += `- ${analysis.brokenHomepage.length} repositories with potentially broken homepages\n\n`;

  if (analysis.missingDescription.length > 0) {
    content += `REPOSITORIES MISSING DESCRIPTIONS:\n`;
    content += `${"-".repeat(40)}\n`;
    analysis.missingDescription.forEach((repo) => {
      content += `- ${repo.name}\n`;
      content += `  URL: ${repo.html_url}\n`;
      content += `  Language: ${repo.language || "Not specified"}\n`;
      content += `  Stars: ${repo.stargazers_count}, Forks: ${repo.forks_count}\n\n`;
    });
  }

  if (analysis.missingHomepage.length > 0) {
    content += `REPOSITORIES MISSING HOMEPAGES:\n`;
    content += `${"-".repeat(40)}\n`;
    analysis.missingHomepage.forEach((repo) => {
      content += `- ${repo.name}\n`;
      content += `  URL: ${repo.html_url}\n`;
      content += `  Description: ${repo.description || "No description"}\n`;
      content += `  Language: ${repo.language || "Not specified"}\n\n`;
    });
  }

  if (analysis.brokenHomepage.length > 0) {
    content += `REPOSITORIES WITH POTENTIALLY BROKEN HOMEPAGES:\n`;
    content += `${"-".repeat(50)}\n`;
    analysis.brokenHomepage.forEach((repo) => {
      content += `- ${repo.name}\n`;
      content += `  URL: ${repo.html_url}\n`;
      content += `  Current Homepage: ${repo.homepage}\n`;
      content += `  Description: ${repo.description || "No description"}\n\n`;
    });
  }

  return content;
}

/**
 * Get file extension and determine format
 */
export function getOutputFormat(filename: string): OutputFormat {
  const extension = filename.toLowerCase().split(".").pop();

  switch (extension) {
    case "json":
      return "json";
    case "csv":
      return "csv" as OutputFormat; // We'll add this to types
    case "txt":
    default:
      return "txt";
  }
}

/**
 * Write repositories to file with proper formatting
 */
export async function writeRepositoriesToFile(
  repos: GitHubRepository[],
  username: string,
  filename: string
): Promise<void> {
  const s = spinner();
  s.start(`Writing repositories to ${filename}...`);

  try {
    const format = getOutputFormat(filename);
    let content: string;

    switch (format) {
      case "json":
        content = formatAsJson(repos, username);
        break;
      case "csv":
        content = formatAsCsv(repos, username);
        break;
      case "txt":
      default:
        content = formatAsText(repos, username);
        break;
    }

    await fs.writeFile(filename, content, "utf8");
    s.stop(
      `✅ Successfully wrote ${
        repos.length
      } repositories to ${filename} (${format.toUpperCase()} format)`
    );
  } catch (error) {
    s.stop(`❌ Failed to write to ${filename}`);
    throw error;
  }
}

/**
 * Write analysis report to file
 */
export async function writeAnalysisToFile(
  repos: GitHubRepository[],
  analysis: {
    missingDescription: GitHubRepository[];
    missingHomepage: GitHubRepository[];
    brokenHomepage: GitHubRepository[];
  },
  username: string,
  filename: string
): Promise<void> {
  const s = spinner();
  s.start(`Writing analysis report to ${filename}...`);

  try {
    const content = formatAnalysisReport(repos, analysis, username);
    await fs.writeFile(filename, content, "utf8");
    s.stop(`✅ Analysis report written to ${filename}`);
  } catch (error) {
    s.stop(`❌ Failed to write analysis to ${filename}`);
    throw error;
  }
}
