# GitHub Repository Fetcher

An interactive command-line tool to fetch and display GitHub user repositories. Get detailed information about any GitHub user's public repositories with a modern, user-friendly interface.

## Features

- 🚀 Interactive command-line interface with modern prompts
- 📊 Fetches all public repositories for any GitHub user
- 📝 Displays comprehensive repository details:
  - Name and star count
  - Description
  - Homepage/URL
  - Primary language
  - Creation and last update dates
- 💾 Multiple output formats: **Text (.txt)** and **JSON (.json)**
- 📄 Optional file output with interactive file naming
- ⚡ Progress indicators and error handling
- 🎯 Command-line arguments for quick access
- 🔐 GitHub token support for private repositories


## Recent Changes

*This section is automatically updated based on recent commits.*

### 2025-08-01 - b5cf8f9

**📦 Dependencies:**
- Updated dependencies

## 2025-08-01 - f74ca1e

**✨ New Features:**
- Added authentication support

**📦 Dependencies:**
- Updated dependencies

**📚 Documentation:**
- Updated documentation

## 2025-08-01 - 11af27f

**✨ New Features:**
- Added JSON output format support

## Installation

1. Clone this repository:

```bash
git clone [your-repo-url]
cd repo-fetcher
```

2. Install dependencies:

```bash
bun install
```

## Usage

The tool can be used in three ways:

### 1. Interactive Mode

```bash
bun run index.ts
```

This will guide you through the process with interactive prompts.

### 2. Username Only

```bash
bun run index.ts -U octocat
```

Fetches repositories and asks if you want to save to a file.

### 3. Full Command

```bash
bun run index.ts -U octocat -f output.txt
```

Fetches repositories and saves directly to the specified file.

### Command Line Options

- `-U, --user <username>`: GitHub username to fetch repositories for
- `-f, --file <filename>`: Save output to specified file (.txt or .json)
- `-s, --sort <type>`: Sort repositories by a specific criteria:
  - `updated`: Last updated date (default)
  - `created`: Creation date
  - `stars`: Number of stars
  - `name`: Repository name
- `-t, --token <token>`: GitHub personal access token for private repos
- `--help`: Display help information
- `--version`: Display version information

### Examples

```bash
# Sort by number of stars and save as JSON
bun run index.ts -U octocat -s stars -f output.json

# Sort by creation date and save as text file
bun run index.ts -U octocat -s created -f output.txt

# Sort alphabetically by name with JSON output
bun run index.ts -U octocat -s name -f repositories.json

# Use personal access token for private repos
bun run index.ts -U your-username -t github_pat_... -f all-repos.json
```

## Output Formats

### Text Format (.txt)
Human-readable format with detailed repository information, perfect for viewing and sharing.

### JSON Format (.json)
Structured data format ideal for:
- API integrations
- Data processing and analysis
- Backup and archival
- Automated workflows

## Requirements

- [Bun](https://bun.sh/) runtime

## Dependencies

- `octokit`: Official GitHub API client for JavaScript/TypeScript
- `commander`: For command-line argument parsing
- `@clack/prompts`: For interactive CLI interface

## Contributing

Feel free to fork this repository, create a feature branch, and submit a Pull Request if you have any improvements or feature additions.

## License

ISC
