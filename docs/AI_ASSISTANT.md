# AI Assistant — Library Comparison & Recommendation

---

## The Options

### Option A — Vercel AI SDK + `assistant-ui` ⭐ RECOMMENDED

|                   |                                                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel AI SDK** | `npm i ai` — official SDK for streaming LLM responses in Next.js. Provides `streamText`, `useChat`, `useAssistant` hooks and a unified interface across Gemini, OpenAI, Anthropic, etc. |
| **assistant-ui**  | `npm i @assistant-ui/react` — pre-built, headless-first chat UI components designed specifically to work with Vercel AI SDK. Think shadcn/ui but for chat.                              |

**Pros:**

- ✅ First-class Next.js App Router + RSC support
- ✅ Built-in streaming with Server-Sent Events handle for you
- ✅ `useChat` hook handles message history, loading, error state
- ✅ Google Gemini provider: `@ai-sdk/google` (official)
- ✅ `assistant-ui` gives Thread, Message, Input components that match shadcn design system
- ✅ Supports tool-calling / function-calling out of the box (useful for future features like "insert a diagram")
- ✅ Actively maintained, large community

**Cons:**

- ❌ `assistant-ui` adds another dependency
- ❌ Vercel AI SDK's Gemini adapter is newer than OpenAI; minor API surface differences

**Integration effort: Low** (2–3 hours to get streaming chat working)

---

### Option B — Build from Scratch

Build your own `fetch` streaming handler with `ReadableStream` and a basic chat UI.

**Pros:**

- ✅ Zero additional dependencies
- ✅ Full control over every byte

**Cons:**

- ❌ Significant boilerplate: manual SSE parsing, loading states, scroll-to-bottom, retry logic, abort controller
- ❌ You re-implement exactly what Vercel AI SDK already does, correctly
- ❌ Gemini's streaming API response format requires careful handling

**Integration effort: High** (8–15 hours minimum for production quality)

**Verdict: Not recommended** unless you have a strong reason to avoid dependencies.

---

### Option C — LangChain.js

Full agent orchestration framework.

**Pros:**

- ✅ Powerful for multi-step agents, RAG pipelines, tool chaining

**Cons:**

- ❌ Heavyweight — designed for complex agent pipelines, overkill for a writing assistant
- ❌ Slower iteration, more abstraction layers to debug
- ❌ Larger bundle size

**Verdict: Not recommended** now. Use it in Phase 5 if you add a RAG pipeline over all your notes.

---

### Option D — OpenAI SDK (pointed at Gemini)

Google's Gemini API has an OpenAI-compatible endpoint. You could use the `openai` npm package pointed at `https://generativelanguage.googleapis.com/v1beta/openai`.

**Pros:**

- ✅ Very stable, battle-tested SDK

**Cons:**

- ❌ Not idiomatic — you're using an OpenAI client to talk to Gemini
- ❌ `@ai-sdk/google` is the proper, first-party Vercel AI SDK adapter for Gemini

**Verdict: Not recommended.**

---

## Recommendation Summary

```
Vercel AI SDK (@ai-sdk/google) ← handles all streaming + Gemini protocol
        +
assistant-ui                   ← handles all chat UI components
```

**Implementation recipe:**

```bash
npm i ai @ai-sdk/google @assistant-ui/react
```

**API route (streaming):**

```typescript
// app/api/ai/chat/route.ts
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  const { messages, noteContext } = await req.json();

  const result = await streamText({
    model: google("gemini-2.0-flash"),
    system: `You are a writing assistant. Current note:\n${noteContext}`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

**Client component:**

```typescript
// Using assistant-ui with Vercel AI SDK
import { useChat } from "ai/react";

const { messages, input, handleSubmit, isLoading } = useChat({
  api: "/api/ai/chat",
  body: { noteContext: currentNoteText },
});
```

`assistant-ui`'s `<Thread>` component wraps `useChat` automatically and provides:

- Auto-scrolling message list
- Markdown rendering in responses
- Loading indicator
- Abort/stop generation button
- Copy message button

---

## Gemini Model Choice

| Model              | Best for                                      |
| ------------------ | --------------------------------------------- |
| `gemini-2.0-flash` | Default — fast, cheap, good for chat          |
| `gemini-2.5-pro`   | Complex reasoning, long-context summarization |

**Recommendation:** Start with `gemini-2.0-flash` for all interactions. Add a model toggle in settings later.
