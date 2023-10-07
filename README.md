# GitHub Repositories Info Fetcher

This project allows you to fetch a list of public repositories for a specified GitHub user, along with some basic information about each repository, and write this information to a text file.

## Features

- Fetches all public repositories for a specified GitHub user.
- Retrieves basic repository info including name, star count, description, URL, primary language, creation and last updated dates.
- Writes the retrieved information to a text file, creating it if it doesn't exist or appending to it if it does.

## Setup

1. Clone this repository:

```bash
git clone https://github.com/your-username/github-repo-info-fetcher.git
```

2. Navigate to the project directory:

```bash
cd github-repo-info-fetcher
```

3. Install the necessary dependencies:

```bash
npm install
```

4. Edit the file in the project root and specify the GitHub profile link as follows:

```
constprofileLink="https://github.com/Abdul-Asa";
```

5. Compile the TypeScript file:

```bash
tsc index.ts
```

## Usage

Run the script using the following command:

```bash
npm start
```

The script will fetch the repository information for the specified GitHub user and write it to a file named `profile.txt` in the project directory.

## Dependencies

- axios: For making HTTP requests to the GitHub API

## Contributing

Feel free to fork this repository, create a feature branch, and submit a Pull Request if you have any improvements or feature additions.

---

Make sure to replace "your-username" and "target-username" with the actual GitHub usernames, and update the repository URL accordingly. Adjust any other details to better fit the specifics of your project.
