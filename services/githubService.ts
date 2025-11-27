import { GithubCommitItem } from "../types";

const LINUX_REPO = "torvalds/linux";

/**
 * Searches the Linux Kernel repository for commits matching the query.
 * Acts as the "Retrieval" step in RAG.
 */
export const searchLinuxKernelCommits = async (query: string): Promise<string> => {
  // Construct a search query for the Linux kernel repo.
  // We limit to the repo.
  // NOTE: 'query' here should be keywords, not a sentence, for best GitHub results.
  const q = `repo:${LINUX_REPO} ${query}`;
  
  try {
    // The cloak-preview header is often required for the Commit Search API to function correctly.
    const response = await fetch(`https://api.github.com/search/commits?q=${encodeURIComponent(q)}&per_page=30`, {
      headers: {
        'Accept': 'application/vnd.github.cloak-preview+json',
      }
    });

    if (!response.ok) {
       if (response.status === 403) {
          throw new Error("GitHub API rate limit exceeded. Please wait a moment or use a local log file.");
       }
       if (response.status === 422) {
         throw new Error("Validation failed. Try different keywords.");
       }
       throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const items = data.items as GithubCommitItem[];

    if (!items || items.length === 0) {
      return "";
    }

    // Transform the GitHub JSON response into a text block that looks like a Git Log.
    // This provides a familiar format for Gemini to analyze.
    return items.map(item => `
commit ${item.sha}
Author: ${item.commit.author.name}
Date:   ${item.commit.author.date}
Link:   ${item.html_url}

    ${item.commit.message}
    `).join("\n\n------------------------------------------------\n\n");

  } catch (error) {
    console.error("GitHub Service Error:", error);
    throw error;
  }
};