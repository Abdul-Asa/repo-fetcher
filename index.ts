import axios from "axios";
import * as fs from "fs";

// Function to fetch and write GitHub profile info to a file
async function fetchAndWriteGitHubInfo(profileLink: string): Promise<void> {
  // Extracting the username from the provided GitHub profile link
  const username = profileLink.split("/").pop() || "";

  if (!username) {
    console.error("Invalid GitHub profile link");
    return;
  }

  try {
    // Fetching the list of public repositories for the specified username
    const response = await axios.get(
      `https://api.github.com/users/${username}/repos`
    );
    const repos = response.data;

    // Creating a string to write to the file
    let output = `Profile: ${profileLink}\nRepositories:\n`;

    repos.forEach((repo: any) => {
      output += `\n- ${repo.name} (${repo.stargazers_count} stars)\n`;
      output += `  Description: ${
        repo.description || "No description provided"
      }\n`;
      output += `  URL: ${repo.html_url}\n`;
      output += `  Language: ${repo.language || "Not specified"}\n`;
      output += `  Created At: ${repo.created_at}\n`;
      output += `  Updated At: ${repo.updated_at}\n`;
    });

    // Writing the information to profile.txt
    fs.appendFileSync("profile.txt", output);
    console.log("Profile information written to profile.txt");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching GitHub information:", error.message);
    }
  }
}

// Parsing the GitHub profile link from the command line arguments
const profileLink = "https://github.com/Abdul-Asa"; //Enter your GH profile link

if (profileLink) {
  fetchAndWriteGitHubInfo(profileLink);
} else {
  console.error("Please provide a GitHub profile link as an argument");
}
