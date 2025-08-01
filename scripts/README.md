# Automated README Update System

This directory contains scripts for automatically updating the project README.md based on git commit changes.

## Components

### 1. `update-readme.js`
The main script that analyzes git commits and updates the README accordingly.

**Features:**
- Analyzes commit messages and changed files
- Categorizes changes into: Features, Bug Fixes, Documentation, Dependencies, Breaking Changes
- Automatically adds/updates a "Recent Changes" section in README.md
- Keeps track of the last 5 changelog entries
- Provides detailed commit information with dates and hashes

**Usage:**
```bash
node scripts/update-readme.js
```

### 2. `setup-hooks.sh`
Installation script that sets up Git hooks for automatic README updates.

**What it does:**
- Installs the post-commit hook from `.githooks/post-commit`
- Sets proper permissions for all scripts
- Provides instructions and documentation

**Usage:**
```bash
./scripts/setup-hooks.sh
```

### 3. `.githooks/post-commit`
Git hook that runs automatically after each commit to update the README.

**Behavior:**
- Runs the `update-readme.js` script after every commit
- Provides feedback about whether README was updated
- Suggests commands for committing README changes

## How It Works

1. **Commit Detection**: After each commit, the post-commit hook executes
2. **Analysis**: The script analyzes the commit message and changed files
3. **Categorization**: Changes are categorized by type (features, fixes, etc.)
4. **README Update**: A "Recent Changes" section is added/updated in README.md
5. **Feedback**: The system provides feedback about what was updated

## Change Detection Patterns

The system recognizes changes based on:

**Features:**
- Keywords: "add", "new", "implement", "feature"
- Specific patterns for JSON support, authentication, sorting, CLI enhancements

**Bug Fixes:**
- Keywords: "fix", "bug", "error", "issue"

**Documentation:**
- File changes: README.md, *.md files

**Dependencies:**
- File changes: package.json, bun.lock

**Breaking Changes:**
- Keywords: "breaking", "break", "major"

## Manual Usage

You can run the README updater manually at any time:

```bash
# Update README based on the latest commit
node scripts/update-readme.js

# Set up hooks (one-time setup)
./scripts/setup-hooks.sh
```

## Configuration

The system is designed to work out-of-the-box with minimal configuration. The main configurable aspects are:

- **Changelog entries**: Currently keeps the last 5 entries (configurable in `update-readme.js`)
- **Detection patterns**: Keyword patterns for change categorization
- **README sections**: Where the changelog is inserted in the README

## Example Output

When a commit with message "Add JSON support" is made, the system will:

1. Detect it as a feature addition
2. Add an entry to the "Recent Changes" section:

```markdown
## Recent Changes

### 2025-01-08 - a1b2c3d

**✨ New Features:**
- Added JSON output format support
```

## Troubleshooting

**Hook not running:**
- Check that `.git/hooks/post-commit` exists and is executable
- Re-run `./scripts/setup-hooks.sh`

**Script errors:**
- Ensure Node.js is installed
- Check that you're in the project root directory
- Verify git repository is initialized

**README not updating:**
- Check script output for error messages
- Ensure README.md exists in the project root
- Verify git commit was successful