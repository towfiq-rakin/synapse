import { auth } from "@clerk/nextjs/server";

import { getAuthenticatedUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongoose";
import Note, { type INote } from "@/lib/db/models/Note";
import { getGeminiClient, DEFAULT_GEMINI_MODEL } from "@/lib/ai/gemini";
import { buildNoteAssistantPrompt } from "@/lib/ai/note-assistant-prompts";
import {
  validateAiChatRequest,
  type AiChatMessage,
} from "@/lib/ai/ai-request-validation";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import type { Content } from "@google/genai";

/* ── helpers ──────────────────────────────────────────────────────── */

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * Convert our chat messages to the Gemini `contents` format.
 * The final user message is built by `buildNoteAssistantPrompt`, so we only
 * include prior conversation history here.
 */
function toGeminiHistory(messages: AiChatMessage[]): Content[] {
  // Exclude the last user message — it will be injected via the prompt builder.
  const history = messages.slice(0, -1);

  return history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
}

/* ── POST /api/ai/chat ────────────────────────────────────────────── */

export async function POST(request: Request) {
  /* ── 1. Auth ──────────────────────────────────────────────────── */
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return jsonError("Sign in to use the AI assistant.", 401);
  }

  // Get app-local userId (creates record if first visit)
  const localUserId = await getAuthenticatedUserId();

  if (!localUserId) {
    return jsonError("Unable to resolve user account.", 401);
  }

  /* ── 2. Rate limit ────────────────────────────────────────────── */
  const rateCheck = checkRateLimit(clerkUserId);

  if (!rateCheck.allowed) {
    const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1_000);
    return jsonError(
      `Too many AI requests. Please try again in ${retrySeconds} seconds.`,
      429,
    );
  }

  /* ── 3. Parse & validate body ─────────────────────────────────── */
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const validation = validateAiChatRequest(body);

  if (validation.error) {
    return jsonError(validation.error, 400);
  }

  const { noteId, messages, action, selectedText, currentMarkdown } =
    validation.data!;

  /* ── 4. Load & verify note ownership ──────────────────────────── */
  await connectToDatabase();

  let note: Pick<INote, "fileName" | "title" | "content"> | null;
  try {
    note = await Note.findOne({ _id: noteId, userId: localUserId })
      .select("fileName title content")
      .lean<Pick<INote, "fileName" | "title" | "content"> | null>();
  } catch {
    return jsonError("Invalid note ID.", 400);
  }

  if (!note) {
    return jsonError("Note not found.", 404);
  }

  /* ── 5. Build prompt ──────────────────────────────────────────── */
  // Prefer client-supplied markdown (may have unsaved edits) over DB content
  const noteMarkdown = currentMarkdown || note.content || "";

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");

  const { systemInstruction, userMessage } = buildNoteAssistantPrompt({
    noteTitle: note.title?.trim() || note.fileName?.trim() || "Untitled",
    noteMarkdown,
    selectedText,
    action,
    userMessage: lastUserMsg?.content,
  });

  /* ── 6. Call Gemini (streaming) ───────────────────────────────── */
  // TODO: Optionally switch to GEMINI_LONG_CONTEXT_MODEL for large notes.

  let geminiStream: AsyncIterable<{ text?: string | null | undefined }>;

  try {
    const client = getGeminiClient();

    const response = await client.models.generateContentStream({
      model: DEFAULT_GEMINI_MODEL,
      config: {
        systemInstruction,
      },
      contents: [
        ...toGeminiHistory(messages),
        { role: "user", parts: [{ text: userMessage }] },
      ],
    });

    geminiStream = response;
  } catch (err) {
    console.error("[ai/chat] Gemini init error:", (err as Error).message);
    return jsonError("AI service is temporarily unavailable.", 500);
  }

  /* ── 7. Stream response ───────────────────────────────────────── */
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of geminiStream) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        console.error("[ai/chat] Stream error:", (err as Error).message);
        controller.enqueue(
          encoder.encode("\n\n[Error: AI response was interrupted.]"),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
