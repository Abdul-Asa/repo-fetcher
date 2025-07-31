export interface Repository {
  name: string;
  description: string | null;
  homepage: string | null;
  html_url: string;
  language: string | null;
  created_at: string;
  updated_at: string;
  stargazers_count: number;
  private: boolean;
}

export type SortOption = "updated" | "created" | "stars" | "name";
