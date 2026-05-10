import type { AiNoteAction } from "./note-assistant-prompts";

/* ── limits ───────────────────────────────────────────────────────── */

const MAX_MESSAGES = 20;
const MAX_USER_MESSAGE_LENGTH = 8_000;
const MAX_SELECTED_TEXT_LENGTH = 12_000;
const MAX_MARKDOWN_LENGTH = 60_000;

const VALID_ACTIONS: Set<string> = new Set<AiNoteAction>([
  "summarize",
  "explain",
  "improve",
  "shorten",
  "expand",
  "fix-grammar",
  "continue-writing",
  "custom",
]);

/* ── types ────────────────────────────────────────────────────────── */

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ValidatedAiChatRequest {
  noteId: string;
  messages: AiChatMessage[];
  action?: AiNoteAction;
  selectedText?: string;
  currentMarkdown?: string;
}

/* ── validation ───────────────────────────────────────────────────── */

/**
 * Validates and normalizes the raw request body for `/api/ai/chat`.
 *
 * Returns `{ data }` on success or `{ error }` on failure.
 */
export function validateAiChatRequest(body: unknown):
  | { data: ValidatedAiChatRequest; error?: never }
  | { data?: never; error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }

  const obj = body as Record<string, unknown>;

  /* ── noteId ───────────────────────────────────────────────── */
  if (typeof obj.noteId !== "string" || !obj.noteId.trim()) {
    return { error: "noteId is required and must be a non-empty string." };
  }
  const noteId = obj.noteId.trim();

  /* ── messages ─────────────────────────────────────────────── */
  if (!Array.isArray(obj.messages)) {
    return { error: "messages must be an array." };
  }
  if (obj.messages.length > MAX_MESSAGES) {
    return { error: `Too many messages. Maximum is ${MAX_MESSAGES}.` };
  }

  const messages: AiChatMessage[] = [];
  for (const msg of obj.messages) {
    if (!msg || typeof msg !== "object") {
      return { error: "Each message must be an object with role and content." };
    }
    const m = msg as Record<string, unknown>;
    if (m.role !== "user" && m.role !== "assistant") {
      return { error: 'Each message role must be "user" or "assistant".' };
    }
    if (typeof m.content !== "string") {
      return { error: "Each message content must be a string." };
    }
    if (m.role === "user" && m.content.length > MAX_USER_MESSAGE_LENGTH) {
      return {
        error: `User message too long. Maximum is ${MAX_USER_MESSAGE_LENGTH} characters.`,
      };
    }
    messages.push({ role: m.role, content: m.content });
  }

  /* ── action ───────────────────────────────────────────────── */
  let action: AiNoteAction | undefined;
  if (obj.action !== undefined && obj.action !== null) {
    if (typeof obj.action !== "string" || !VALID_ACTIONS.has(obj.action)) {
      return {
        error: `Invalid action. Must be one of: ${[...VALID_ACTIONS].join(", ")}.`,
      };
    }
    action = obj.action as AiNoteAction;
  }

  /* ── selectedText ─────────────────────────────────────────── */
  let selectedText: string | undefined;
  if (obj.selectedText !== undefined && obj.selectedText !== null) {
    if (typeof obj.selectedText !== "string") {
      return { error: "selectedText must be a string." };
    }
    if (obj.selectedText.length > MAX_SELECTED_TEXT_LENGTH) {
      return {
        error: `selectedText too long. Maximum is ${MAX_SELECTED_TEXT_LENGTH} characters.`,
      };
    }
    if (obj.selectedText.trim()) {
      selectedText = obj.selectedText;
    }
  }

  /* ── currentMarkdown ──────────────────────────────────────── */
  let currentMarkdown: string | undefined;
  if (obj.currentMarkdown !== undefined && obj.currentMarkdown !== null) {
    if (typeof obj.currentMarkdown !== "string") {
      return { error: "currentMarkdown must be a string." };
    }
    if (obj.currentMarkdown.length > MAX_MARKDOWN_LENGTH) {
      return {
        error: `currentMarkdown too long. Maximum is ${MAX_MARKDOWN_LENGTH} characters.`,
      };
    }
    if (obj.currentMarkdown.trim()) {
      currentMarkdown = obj.currentMarkdown;
    }
  }

  /* ── final user message / action check ────────────────────── */
  const lastMsg = messages[messages.length - 1];
  const hasUserContent = lastMsg?.role === "user" && lastMsg.content.trim();
  if (!hasUserContent && !action) {
    return {
      error:
        "Either provide a user message or specify an action (e.g. summarize).",
    };
  }

  return {
    data: { noteId, messages, action, selectedText, currentMarkdown },
  };
}
