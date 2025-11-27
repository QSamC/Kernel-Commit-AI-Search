export interface CommitAnalysis {
  commitHash: string;
  author: string;
  date: string;
  subject: string;
  relevanceScore: number;
  reasoning: string;
  url?: string; // Optional URL for linking back to GitHub
}

export interface CommitSearchResult {
  query: string;
  results: CommitAnalysis[];
}

export enum AppState {
  IDLE = 'IDLE',
  FETCHING_GITHUB = 'FETCHING_GITHUB',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export enum DataSource {
  GITHUB = 'GITHUB',
  LOCAL_FILE = 'LOCAL_FILE'
}

export interface GithubCommitItem {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}
