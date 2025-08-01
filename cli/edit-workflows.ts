import { text, select, multiselect, confirm } from "@clack/prompts";
import { GitHubRepository, RepositoryUpdateData } from "./types.js";
import { GitHubService } from "./github-service.js";
import { writeAnalysisToFile } from "./formatters.js";

/**
 * Interactive workflow to edit a single repository
 */
export async function editSingleRepository(
  githubService: GitHubService,
  repo: GitHubRepository
): Promise<void> {
  console.log(`\n📝 Editing repository: ${repo.name}`);
  console.log(`Current description: ${repo.description || "No description"}`);
  console.log(`Current homepage: ${repo.homepage || "No homepage"}`);

  const updateData: RepositoryUpdateData = {};

  // Edit description
  const newDescription = (await text({
    message: "Enter new description (leave empty to keep current):",
    placeholder: repo.description || "Enter repository description...",
  })) as string;

  if (
    newDescription &&
    newDescription.trim() !== "" &&
    newDescription !== repo.description
  ) {
    updateData.description = newDescription.trim();
  }

  // Edit homepage
  const newHomepage = (await text({
    message: "Enter new homepage URL (leave empty to keep current):",
    placeholder: repo.homepage || "https://example.com",
  })) as string;

  if (
    newHomepage &&
    newHomepage.trim() !== "" &&
    newHomepage !== repo.homepage
  ) {
    updateData.homepage = newHomepage.trim();
  }

  // Edit privacy setting
  const changePrivacy = await confirm({
    message: `Repository is currently ${
      repo.private ? "private" : "public"
    }. Change privacy?`,
    initialValue: false,
  });

  if (changePrivacy) {
    updateData.private = !repo.private;
  }

  // Edit features
  const editFeatures = await confirm({
    message: "Edit repository features (issues, wiki, projects)?",
    initialValue: false,
  });

  if (editFeatures) {
    // Get current repository details to see current feature settings
    const currentRepo = await githubService.getRepository(
      repo.owner.login,
      repo.name
    );

    const features = (await multiselect({
      message: "Select features to enable:",
      options: [
        {
          value: "has_issues",
          label: "Issues",
          hint: currentRepo.has_issues
            ? "Currently enabled"
            : "Currently disabled",
        },
        {
          value: "has_wiki",
          label: "Wiki",
          hint: currentRepo.has_wiki
            ? "Currently enabled"
            : "Currently disabled",
        },
        {
          value: "has_projects",
          label: "Projects",
          hint: currentRepo.has_projects
            ? "Currently enabled"
            : "Currently disabled",
        },
      ],
    })) as string[];

    updateData.has_issues = features.includes("has_issues");
    updateData.has_wiki = features.includes("has_wiki");
    updateData.has_projects = features.includes("has_projects");
  }

  // Show changes summary
  if (Object.keys(updateData).length === 0) {
    console.log("No changes to apply.");
    return;
  }

  console.log("\n📋 Changes to apply:");
  if (updateData.description !== undefined) {
    console.log(
      `  Description: "${repo.description || "None"}" → "${
        updateData.description
      }"`
    );
  }
  if (updateData.homepage !== undefined) {
    console.log(
      `  Homepage: "${repo.homepage || "None"}" → "${updateData.homepage}"`
    );
  }
  if (updateData.private !== undefined) {
    console.log(
      `  Privacy: ${repo.private ? "Private" : "Public"} → ${
        updateData.private ? "Private" : "Public"
      }`
    );
  }
  if (updateData.has_issues !== undefined) {
    console.log(`  Issues: ${updateData.has_issues ? "Enabled" : "Disabled"}`);
  }
  if (updateData.has_wiki !== undefined) {
    console.log(`  Wiki: ${updateData.has_wiki ? "Enabled" : "Disabled"}`);
  }
  if (updateData.has_projects !== undefined) {
    console.log(
      `  Projects: ${updateData.has_projects ? "Enabled" : "Disabled"}`
    );
  }

  const confirmUpdate = await confirm({
    message: "Apply these changes?",
    initialValue: true,
  });

  if (confirmUpdate) {
    await githubService.updateRepository(
      repo.owner.login,
      repo.name,
      updateData
    );
  } else {
    console.log("❌ Changes cancelled.");
  }
}

/**
 * Interactive workflow to batch edit repositories
 */
export async function batchEditRepositories(
  githubService: GitHubService,
  repositories: GitHubRepository[]
): Promise<void> {
  console.log(`\n🔧 Batch editing ${repositories.length} repositories`);

  const editType = await select({
    message: "What type of batch edit would you like to perform?",
    options: [
      {
        value: "add-description",
        label: "Add descriptions to repositories missing them",
      },
      {
        value: "fix-homepage",
        label: "Fix homepage URLs",
      },
      {
        value: "update-privacy",
        label: "Update privacy settings",
      },
      {
        value: "custom-updates",
        label: "Apply custom updates to selected repositories",
      },
    ],
  });

  switch (editType) {
    case "add-description":
      await batchAddDescriptions(githubService, repositories);
      break;
    case "fix-homepage":
      await batchFixHomepages(githubService, repositories);
      break;
    case "update-privacy":
      await batchUpdatePrivacy(githubService, repositories);
      break;
    case "custom-updates":
      await batchCustomUpdates(githubService, repositories);
      break;
  }
}

/**
 * Batch add descriptions to repositories missing them
 */
async function batchAddDescriptions(
  githubService: GitHubService,
  repositories: GitHubRepository[]
): Promise<void> {
  const reposWithoutDescription = repositories.filter(
    (repo) => !repo.description || repo.description.trim() === ""
  );

  if (reposWithoutDescription.length === 0) {
    console.log("✅ All repositories already have descriptions!");
    return;
  }

  console.log(
    `\n📝 Found ${reposWithoutDescription.length} repositories without descriptions`
  );

  const useTemplate = await confirm({
    message:
      "Use a template description? (Otherwise, you'll be prompted for each repo)",
    initialValue: true,
  });

  if (useTemplate) {
    const template = (await text({
      message: "Enter description template (use {name} for repo name):",
      placeholder: "A {name} project built with TypeScript",
    })) as string;

    if (!template) {
      console.log("❌ Template required for batch operation");
      return;
    }

    const updates = reposWithoutDescription.map((repo) => ({
      owner: repo.owner.login,
      repo: repo.name,
      data: {
        description: template.replace(/{name}/g, repo.name),
      },
    }));

    await githubService.batchUpdateRepositories(updates);
  } else {
    // Interactive mode for each repository
    for (const repo of reposWithoutDescription) {
      const description = (await text({
        message: `Enter description for ${repo.name}:`,
        placeholder: "Repository description...",
      })) as string;

      if (description && description.trim() !== "") {
        try {
          await githubService.updateRepository(repo.owner.login, repo.name, {
            description: description.trim(),
          });
        } catch (error) {
          console.error(`Failed to update ${repo.name}: ${error}`);
        }
      }
    }
  }
}

/**
 * Batch fix homepage URLs
 */
async function batchFixHomepages(
  githubService: GitHubService,
  repositories: GitHubRepository[]
): Promise<void> {
  const reposWithIssues = repositories.filter((repo) => {
    if (!repo.homepage) return false;

    const homepage = repo.homepage.toLowerCase();
    return (
      (!homepage.startsWith("http://") &&
        !homepage.startsWith("https://") &&
        !homepage.startsWith("www.")) ||
      homepage.includes("localhost") ||
      homepage.includes("127.0.0.1")
    );
  });

  if (reposWithIssues.length === 0) {
    console.log("✅ No homepage issues found!");
    return;
  }

  console.log(
    `\n🔗 Found ${reposWithIssues.length} repositories with homepage issues`
  );

  for (const repo of reposWithIssues) {
    console.log(`\n📝 Fixing homepage for: ${repo.name}`);
    console.log(`Current homepage: ${repo.homepage}`);

    const newHomepage = (await text({
      message: "Enter corrected homepage URL (or leave empty to remove):",
      placeholder: "https://example.com",
    })) as string;

    if (newHomepage !== undefined) {
      try {
        await githubService.updateRepository(repo.owner.login, repo.name, {
          homepage: newHomepage.trim() || null,
        });
      } catch (error) {
        console.error(`Failed to update ${repo.name}: ${error}`);
      }
    }
  }
}

/**
 * Batch update privacy settings
 */
async function batchUpdatePrivacy(
  githubService: GitHubService,
  repositories: GitHubRepository[]
): Promise<void> {
  const publicRepos = repositories.filter((repo) => !repo.private);
  const privateRepos = repositories.filter((repo) => repo.private);

  console.log(
    `\n🔒 Current status: ${publicRepos.length} public, ${privateRepos.length} private`
  );

  const action = await select({
    message: "What privacy changes would you like to make?",
    options: [
      {
        value: "make-private",
        label: `Make selected public repositories private (${publicRepos.length} available)`,
        disabled: publicRepos.length === 0,
      },
      {
        value: "make-public",
        label: `Make selected private repositories public (${privateRepos.length} available)`,
        disabled: privateRepos.length === 0,
      },
    ],
  });

  const targetRepos = action === "make-private" ? publicRepos : privateRepos;
  const targetPrivacy = action === "make-private";

  if (targetRepos.length === 0) {
    console.log("No repositories available for this operation.");
    return;
  }

  const selectedRepos = (await multiselect({
    message: `Select repositories to make ${
      targetPrivacy ? "private" : "public"
    }:`,
    options: targetRepos.map((repo) => ({
      value: repo.name,
      label: `${repo.name} (${repo.description || "No description"})`,
    })),
  })) as string[];

  if (selectedRepos.length === 0) {
    console.log("No repositories selected.");
    return;
  }

  const updates = selectedRepos.map((repoName) => {
    const repo = targetRepos.find((r) => r.name === repoName)!;
    return {
      owner: repo.owner.login,
      repo: repo.name,
      data: { private: targetPrivacy },
    };
  });

  await githubService.batchUpdateRepositories(updates);
}

/**
 * Custom batch updates workflow
 */
async function batchCustomUpdates(
  githubService: GitHubService,
  repositories: GitHubRepository[]
): Promise<void> {
  const selectedRepos = (await multiselect({
    message: "Select repositories to update:",
    options: repositories.map((repo) => ({
      value: repo.name,
      label: `${repo.name} (${repo.description || "No description"})`,
    })),
  })) as string[];

  if (selectedRepos.length === 0) {
    console.log("No repositories selected.");
    return;
  }

  console.log(
    `\n🔧 Setting up custom updates for ${selectedRepos.length} repositories`
  );

  const updateData: RepositoryUpdateData = {};

  // Description update
  const updateDescription = await confirm({
    message: "Update descriptions?",
    initialValue: false,
  });

  if (updateDescription) {
    const description = (await text({
      message: "Enter new description (use {name} for repository name):",
      placeholder: "A {name} project",
    })) as string;

    if (description) {
      updateData.description = description;
    }
  }

  // Homepage update
  const updateHomepage = await confirm({
    message: "Update homepage URLs?",
    initialValue: false,
  });

  if (updateHomepage) {
    const homepage = (await text({
      message: "Enter homepage URL (use {name} for repository name):",
      placeholder: "https://username.github.io/{name}",
    })) as string;

    if (homepage) {
      updateData.homepage = homepage;
    }
  }

  if (Object.keys(updateData).length === 0) {
    console.log("No updates configured.");
    return;
  }

  const updates = selectedRepos.map((repoName) => {
    const repo = repositories.find((r) => r.name === repoName)!;
    const repoUpdateData = { ...updateData };

    // Replace placeholders
    if (repoUpdateData.description) {
      repoUpdateData.description = repoUpdateData.description.replace(
        /{name}/g,
        repo.name
      );
    }
    if (repoUpdateData.homepage) {
      repoUpdateData.homepage = repoUpdateData.homepage.replace(
        /{name}/g,
        repo.name
      );
    }

    return {
      owner: repo.owner.login,
      repo: repo.name,
      data: repoUpdateData,
    };
  });

  await githubService.batchUpdateRepositories(updates);
}

/**
 * Analyze repositories and optionally save analysis report
 */
export async function analyzeRepositories(
  githubService: GitHubService,
  repositories: GitHubRepository[],
  username: string
): Promise<void> {
  const analysis = await githubService.findRepositoriesNeedingUpdate(
    repositories
  );

  const saveReport = await confirm({
    message: "Save detailed analysis report to file?",
    initialValue: true,
  });

  if (saveReport) {
    const filename = (await text({
      message: "Enter filename for analysis report:",
      placeholder: "repository-analysis.txt",
      defaultValue: "repository-analysis.txt",
    })) as string;

    if (filename) {
      await writeAnalysisToFile(repositories, analysis, username, filename);
    }
  }

  // Offer to start batch editing
  const totalIssues =
    analysis.missingDescription.length +
    analysis.missingHomepage.length +
    analysis.brokenHomepage.length;

  if (totalIssues > 0) {
    const startEditing = await confirm({
      message: `Found ${totalIssues} repositories that need attention. Start batch editing?`,
      initialValue: true,
    });

    if (startEditing) {
      const allProblematicRepos = [
        ...analysis.missingDescription,
        ...analysis.missingHomepage,
        ...analysis.brokenHomepage,
      ].filter(
        (repo, index, self) => self.findIndex((r) => r.id === repo.id) === index
      ); // Remove duplicates

      await batchEditRepositories(githubService, allProblematicRepos);
    }
  }
}
