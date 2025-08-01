#!/usr/bin/env node
//@ts-nocheck
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class ReadmeUpdater {
  constructor() {
    this.readmePath = path.join(process.cwd(), "README.md");
    this.changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  }

  // Get the latest commit information
  getLatestCommit() {
    try {
      const commitHash = execSync("git rev-parse HEAD", {
        encoding: "utf-8",
      }).trim();
      const commitMessage = execSync("git log -1 --pretty=%B", {
        encoding: "utf-8",
      }).trim();
      const commitAuthor = execSync("git log -1 --pretty=%an", {
        encoding: "utf-8",
      }).trim();
      const commitDate = execSync("git log -1 --pretty=%ad --date=short", {
        encoding: "utf-8",
      }).trim();
      const filesChanged = execSync(
        "git diff-tree --no-commit-id --name-only -r HEAD",
        { encoding: "utf-8" }
      )
        .trim()
        .split("\n")
        .filter((f) => f);

      return {
        hash: commitHash.substring(0, 7),
        message: commitMessage,
        author: commitAuthor,
        date: commitDate,
        files: filesChanged,
      };
    } catch (error) {
      console.error("Error getting commit information:", error.message);
      return null;
    }
  }

  // Analyze commit to determine what type of changes were made
  analyzeCommit(commit) {
    const changes = {
      features: [],
      fixes: [],
      docs: [],
      dependencies: [],
      breaking: [],
      other: [],
    };

    const message = commit.message.toLowerCase();
    const files = commit.files;

    // Feature detection
    if (
      message.includes("add") ||
      message.includes("new") ||
      message.includes("implement") ||
      message.includes("feature")
    ) {
      if (
        message.includes("json") ||
        message.includes("format") ||
        message.includes("output")
      ) {
        changes.features.push("Added JSON output format support");
      } else if (message.includes("auth") || message.includes("token")) {
        changes.features.push("Added authentication support");
      } else if (message.includes("sort") || message.includes("order")) {
        changes.features.push("Added sorting capabilities");
      } else if (message.includes("cli") || message.includes("command")) {
        changes.features.push("Enhanced command-line interface");
      } else {
        changes.features.push(`Added: ${commit.message}`);
      }
    }

    // Fix detection
    if (
      message.includes("fix") ||
      message.includes("bug") ||
      message.includes("error") ||
      message.includes("issue")
    ) {
      changes.fixes.push(`Fixed: ${commit.message}`);
    }

    // Documentation changes
    if (files.some((f) => f.includes("README") || f.includes(".md"))) {
      changes.docs.push("Updated documentation");
    }

    // Dependency changes
    if (
      files.some((f) => f.includes("package.json") || f.includes("bun.lock"))
    ) {
      changes.dependencies.push("Updated dependencies");
    }

    // Breaking changes
    if (
      message.includes("breaking") ||
      message.includes("break") ||
      message.includes("major")
    ) {
      changes.breaking.push(`Breaking change: ${commit.message}`);
    }

    // File-specific changes
    if (files.includes("cli/index.ts")) {
      if (!changes.features.length && !changes.fixes.length) {
        changes.other.push("Updated CLI implementation");
      }
    }

    return changes;
  }

  // Update the README with new information
  updateReadme(changes, commit) {
    if (!fs.existsSync(this.readmePath)) {
      console.error("README.md not found");
      return false;
    }

    let readme = fs.readFileSync(this.readmePath, "utf-8");
    let updated = false;

    // Add changelog section if it doesn't exist
    if (!readme.includes("## Recent Changes")) {
      const changelogSection = `
## Recent Changes

*This section is automatically updated based on recent commits.*

`;
      // Insert after features section
      const featuresIndex = readme.indexOf("## Installation");
      if (featuresIndex !== -1) {
        readme =
          readme.slice(0, featuresIndex) +
          changelogSection +
          readme.slice(featuresIndex);
        updated = true;
      }
    }

    // Update recent changes section
    const changelogRegex = /(## Recent Changes[\s\S]*?)(?=## |$)/;
    const match = readme.match(changelogRegex);

    if (match) {
      let changelogContent = `## Recent Changes

*This section is automatically updated based on recent commits.*

### ${commit.date} - ${commit.hash}
`;

      if (changes.features.length > 0) {
        changelogContent += `
**✨ New Features:**
${changes.features.map((f) => `- ${f}`).join("\n")}
`;
      }

      if (changes.fixes.length > 0) {
        changelogContent += `
**🐛 Bug Fixes:**
${changes.fixes.map((f) => `- ${f}`).join("\n")}
`;
      }

      if (changes.dependencies.length > 0) {
        changelogContent += `
**📦 Dependencies:**
${changes.dependencies.map((f) => `- ${f}`).join("\n")}
`;
      }

      if (changes.docs.length > 0) {
        changelogContent += `
**📚 Documentation:**
${changes.docs.map((f) => `- ${f}`).join("\n")}
`;
      }

      if (changes.breaking.length > 0) {
        changelogContent += `
**⚠️ Breaking Changes:**
${changes.breaking.map((f) => `- ${f}`).join("\n")}
`;
      }

      changelogContent += "\n";

      // Keep only the last 5 changelog entries
      const existingChangelog = match[1];
      const existingEntries = existingChangelog.split("### ").slice(1, 5); // Keep last 4 entries
      if (existingEntries.length > 0) {
        changelogContent += existingEntries
          .map((entry) => "### " + entry)
          .join("");
      }

      readme = readme.replace(changelogRegex, changelogContent);
      updated = true;
    }

    // Update features section if new features were added
    if (changes.features.length > 0) {
      // Check if we need to update the features list
      if (changes.features.some((f) => f.includes("JSON"))) {
        // Already updated JSON support earlier
      }
    }

    if (updated) {
      fs.writeFileSync(this.readmePath, readme, "utf-8");
      console.log("✅ README.md updated successfully");
      return true;
    }

    return false;
  }

  // Main execution function
  run() {
    console.log("🔄 Analyzing recent commit for README updates...");

    const commit = this.getLatestCommit();
    if (!commit) {
      console.error("❌ Could not retrieve commit information");
      return;
    }

    console.log(`📝 Analyzing commit: ${commit.hash} - "${commit.message}"`);

    const changes = this.analyzeCommit(commit);

    // Check if there are meaningful changes to document
    const hasChanges = Object.values(changes).some((arr) => arr.length > 0);

    if (!hasChanges) {
      console.log("ℹ️ No significant changes detected for README update");
      return;
    }

    const updated = this.updateReadme(changes, commit);

    if (updated) {
      console.log("✨ README has been updated with the latest changes");
    } else {
      console.log("ℹ️ No README updates needed");
    }
  }
}

// Run the updater if this script is executed directly
if (require.main === module) {
  const updater = new ReadmeUpdater();
  updater.run();
}

module.exports = ReadmeUpdater;
