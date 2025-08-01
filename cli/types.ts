export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  html_url: string;
  clone_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  has_issues?: boolean;
  has_wiki?: boolean;
  has_projects?: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  };
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface RepositoryUpdateData {
  name?: string;
  description?: string;
  homepage?: string;
  private?: boolean;
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
}

export interface RepositoryStats {
  totalRepositories: number;
  publicRepositories: number;
  privateRepositories: number;
}

export interface FormattedRepositoryData {
  profile: string;
  username: string;
  total_repositories: number;
  public_repositories: number;
  private_repositories: number;
  repositories: FormattedRepository[];
}

export interface FormattedRepository {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  private: boolean;
  homepage: string | null;
  repository_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export type SortOption = "updated" | "created" | "pushed" | "full_name";

export type OutputFormat = "txt" | "json" | "csv";

export interface CLIOptions {
  token?: string;
  user?: string;
  sort?: SortOption;
  file?: string;
}

export interface AuthenticationResult {
  username: string;
  isAuthenticated: boolean;
}
