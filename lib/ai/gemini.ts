import { GoogleGenAI } from "@google/genai";

/**
 * Default model for fast note-assistant tasks (summarize, explain, rewrite).
 */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Pro model for long-context or complex reasoning tasks.
 */
export const GEMINI_LONG_CONTEXT_MODEL = "gemini-2.5-pro";

let cachedClient: GoogleGenAI | null = null;

/**
 * Returns a GoogleGenAI client configured with the server-side API key.
 * Must only be called in server contexts (API routes, Server Actions, etc.).
 */
export function getGeminiClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (server-only, no NEXT_PUBLIC_ prefix).",
    );
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}
