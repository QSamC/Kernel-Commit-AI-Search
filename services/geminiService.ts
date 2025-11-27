import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CommitAnalysis } from "../types";

// We use the Schema type for robust JSON output
const searchResponseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      commitHash: { 
        type: Type.STRING,
        description: "The 7-40 character git commit hash."
      },
      author: { 
        type: Type.STRING, 
        description: "The author of the commit."
      },
      date: { 
        type: Type.STRING,
        description: "The date of the commit."
      },
      subject: { 
        type: Type.STRING,
        description: "The first line or subject of the commit message."
      },
      relevanceScore: { 
        type: Type.NUMBER,
        description: "A score from 0 to 100 indicating how relevant this commit is to the user query."
      },
      reasoning: { 
        type: Type.STRING,
        description: "A brief explanation of why this commit matches the query."
      },
      url: {
        type: Type.STRING,
        description: "The web URL to the commit if available in the source text (e.g., Link: ...)."
      }
    },
    required: ["commitHash", "author", "subject", "relevanceScore", "reasoning"]
  }
};

/**
 * Uses a faster model to convert natural language to search keywords.
 * GitHub Search is literal (not semantic), so we must strip stop words.
 */
export const extractSearchTerms = async (
  userQuery: string,
  apiKey: string
): Promise<string> => {
  if (!apiKey) return userQuery;

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash"; // Fast model for simple tasks

  const prompt = `
    You are a query optimizer for GitHub Code Search.
    Convert the following User Query into a strict set of 2-5 search keywords.
    
    Rules:
    1. Remove stop words (how, to, find, the, commit, that, etc).
    2. Keep technical nouns (e.g. "scheduler", "race condition", "memory leak").
    3. If the query is already keywords, keep them.
    4. Return ONLY the keywords separated by spaces. No markdown, no quotes.

    User Query: "${userQuery}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text?.trim() || userQuery;
  } catch (e) {
    console.warn("Keyword extraction failed, using original query", e);
    return userQuery;
  }
};

export const analyzeCommits = async (
  query: string,
  contextContent: string,
  apiKey: string
): Promise<CommitAnalysis[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Using Gemini 3 Pro Preview for advanced reasoning and long context handling
  const modelId = "gemini-3-pro-preview";

  const prompt = `
    You are an expert Linux Kernel engineer.
    
    Task: Semantic Search & Analysis (RAG)
    
    1.  I have provided a list of git commits in the CONTEXT section below.
    2.  Find the top 5 commits that best answer the user's QUERY.
    3.  Analyze the commit messages (subjects and bodies) deeply.
    4.  Assign a relevance score (0-100).
    5.  Extract the commit URL if present (lines starting with 'Link:').
    
    QUERY: "${query}"

    CONTEXT:
    ${contextContent.substring(0, 950000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: searchResponseSchema,
        temperature: 0.2, 
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    const data = JSON.parse(text) as CommitAnalysis[];
    
    // Sort by relevance just in case the model didn't strictly order them
    return data.sort((a, b) => b.relevanceScore - a.relevanceScore);

  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};