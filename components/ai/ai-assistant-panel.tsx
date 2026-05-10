"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  ClipboardCopy,
  FileText,
  Loader2,
  MessageSquarePlus,
  Pen,
  Scissors,
  SendHorizonal,
  Sparkles,
  Square,
  UnfoldVertical,
  WrapText,
  X,
  SpellCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { AiNoteAction } from "@/lib/ai/note-assistant-prompts";
import { MarkdownContent } from "@/components/ai/markdown-content";

/* ── types ────────────────────────────────────────────────────────── */

interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface AiAssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  noteTitle: string;
  currentMarkdown: string;
  selectedText: string;
  onInsert: (text: string) => void;
  onReplaceSelection: (text: string) => void;
  onAppend: (text: string) => void;
}

/* ── quick actions ────────────────────────────────────────────────── */

interface QuickAction {
  action: AiNoteAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Show only when selectedText exists. */
  selectionOnly?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { action: "summarize", label: "Summarize", icon: FileText },
  { action: "explain", label: "Explain", icon: BookOpen },
  { action: "improve", label: "Improve", icon: Pen, selectionOnly: true },
  { action: "shorten", label: "Shorten", icon: Scissors, selectionOnly: true },
  { action: "expand", label: "Expand", icon: UnfoldVertical, selectionOnly: true },
  { action: "fix-grammar", label: "Fix grammar", icon: SpellCheck, selectionOnly: true },
  { action: "continue-writing", label: "Continue", icon: WrapText },
];

const ACTION_USER_LABELS: Record<AiNoteAction, string> = {
  summarize: "Summarize this note.",
  explain: "Explain this note.",
  improve: "Improve the selected text.",
  shorten: "Shorten the selected text.",
  expand: "Expand the selected text.",
  "fix-grammar": "Fix grammar in the selected text.",
  "continue-writing": "Continue writing from the end.",
  custom: "",
};

let _msgIdCounter = 0;
function nextMsgId(): string {
  return `msg-${Date.now()}-${++_msgIdCounter}`;
}

/* ── component ────────────────────────────────────────────────────── */

export function AiAssistantPanel({
  open,
  onOpenChange,
  noteId,
  noteTitle,
  currentMarkdown,
  selectedText,
  onInsert,
  onReplaceSelection,
  onAppend,
}: AiAssistantPanelProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasSelection = selectedText.trim().length > 0;

  /* ── auto-scroll to bottom ──────────────────────────────────── */
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const viewport = scrollRef.current?.querySelector(
        "[data-slot='scroll-area-viewport']",
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ── close cleanup ──────────────────────────────────────────── */
  function handleClose() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    onOpenChange(false);
  }

  /* ── streaming fetch ────────────────────────────────────────── */
  async function sendRequest(
    allMessages: AiChatMessage[],
    action?: AiNoteAction,
  ) {
    setIsStreaming(true);

    const assistantMsg: AiChatMessage = {
      id: nextMsgId(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMsg]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId,
          messages: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          action: action ?? undefined,
          selectedText: hasSelection ? selectedText : undefined,
          currentMarkdown,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMsg = "Something went wrong.";
        try {
          const errJson = (await response.json()) as { error?: string };
          if (errJson.error) errMsg = errJson.error;
        } catch {
          /* ignore parse error */
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: errMsg } : m,
          ),
        );
        toast.error(errMsg);
        return;
      }

      if (!response.body) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "No response received." }
              : m,
          ),
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        const snapshot = accumulated;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: snapshot } : m,
          ),
        );
        scrollToBottom();
      }

      if (!accumulated.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: "The AI didn't produce a response. Try again.",
                }
              : m,
          ),
        );
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: m.content || "Request cancelled." }
              : m,
          ),
        );
      } else {
        const errMsg = "Failed to reach AI service.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: errMsg } : m,
          ),
        );
        toast.error(errMsg);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  /* ── quick action handler ───────────────────────────────────── */
  function handleQuickAction(action: AiNoteAction) {
    if (isStreaming) return;

    const userMsg: AiChatMessage = {
      id: nextMsgId(),
      role: "user",
      content: ACTION_USER_LABELS[action],
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    sendRequest(nextMessages, action);
  }

  /* ── custom message handler ─────────────────────────────────── */
  function handleSend() {
    if (isStreaming || !input.trim()) return;

    const userMsg: AiChatMessage = {
      id: nextMsgId(),
      role: "user",
      content: input.trim(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    sendRequest(nextMessages, "custom");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleStop() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }

  /* ── copy handler ───────────────────────────────────────────── */
  async function handleCopy(msgId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast.error("Failed to copy.");
    }
  }

  /* ── last assistant content ─────────────────────────────────── */
  const lastAssistantMsg = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.content.trim());

  /* ── new chat ───────────────────────────────────────────────── */
  function handleNewChat() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setMessages([]);
    setInput("");
    setIsStreaming(false);
  }

  /* ── textarea auto-resize ───────────────────────────────────── */
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!open) return null;

  const visibleActions = QUICK_ACTIONS.filter(
    (a) => !a.selectionOnly || hasSelection,
  );

  return (
    <aside className="synapse-ai-panel" aria-label="AI Assistant">
      {/* ── header ──────────────────────────────────────────────── */}
      <div className="synapse-ai-panel__header">
        <div className="synapse-ai-panel__header-left">
          <Sparkles className="synapse-ai-panel__icon" />
          <div>
            <h2 className="synapse-ai-panel__title">Synapse AI</h2>
            <p className="synapse-ai-panel__subtitle">
              {hasSelection ? "Using selected text" : "Using full note"}
              {noteTitle ? ` · ${noteTitle}` : ""}
            </p>
          </div>
        </div>
        <div className="synapse-ai-panel__header-actions">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleNewChat}
            title="New chat"
          >
            <MessageSquarePlus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            title="Close"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* ── quick actions ───────────────────────────────────────── */}
      {messages.length === 0 && (
        <div className="synapse-ai-panel__actions">
          <span className="synapse-ai-panel__actions-label">Quick actions</span>
          <div className="synapse-ai-panel__actions-grid">
            {visibleActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.action}
                  type="button"
                  className="synapse-ai-panel__action-btn"
                  onClick={() => handleQuickAction(qa.action)}
                  disabled={isStreaming}
                >
                  <Icon className="synapse-ai-panel__action-icon" />
                  {qa.label}
                  <ChevronRight className="synapse-ai-panel__action-arrow" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── transcript ──────────────────────────────────────────── */}
      <ScrollArea
        ref={scrollRef}
        className="synapse-ai-panel__transcript"
      >
        {messages.length === 0 && (
          <div className="synapse-ai-panel__empty">
            <Sparkles className="synapse-ai-panel__empty-icon" />
            <p>Ask me anything about this note, or pick a quick action above.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`synapse-ai-panel__msg synapse-ai-panel__msg--${msg.role}`}
          >
            <div className="synapse-ai-panel__msg-content">
              {msg.role === "assistant" &&
              isStreaming &&
              msg === messages[messages.length - 1] &&
              !msg.content ? (
                <span className="synapse-ai-panel__thinking">
                  <Loader2 className="size-3.5 animate-spin" />
                  Thinking…
                </span>
              ) : msg.role === "assistant" ? (
                <MarkdownContent
                  content={msg.content}
                  className="synapse-ai-panel__msg-text synapse-ai-panel__prose"
                />
              ) : (
                <div className="synapse-ai-panel__msg-text">{msg.content}</div>
              )}
            </div>

            {/* per-message actions */}
            {msg.role === "assistant" && msg.content.trim() && (
              <div className="synapse-ai-panel__msg-actions">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title="Copy"
                  onClick={() => handleCopy(msg.id, msg.content)}
                >
                  {copiedId === msg.id ? (
                    <Check className="size-3" />
                  ) : (
                    <ClipboardCopy className="size-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
        ))}
      </ScrollArea>

      {/* ── insert / replace / append bar ────────────────────── */}
      {lastAssistantMsg && !isStreaming && (
        <>
          <Separator />
          <div className="synapse-ai-panel__insert-bar">
            <Button
              variant="outline"
              size="xs"
              onClick={() => onInsert(lastAssistantMsg.content)}
            >
              Insert at cursor
            </Button>
            {hasSelection && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => onReplaceSelection(lastAssistantMsg.content)}
              >
                Replace selection
              </Button>
            )}
            <Button
              variant="outline"
              size="xs"
              onClick={() => onAppend(lastAssistantMsg.content)}
            >
              Append to note
            </Button>
          </div>
        </>
      )}

      <Separator />

      {/* ── input ───────────────────────────────────────────────── */}
      <div className="synapse-ai-panel__input-area">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this note…"
          className="synapse-ai-panel__textarea"
          rows={1}
          disabled={isStreaming}
        />
        {isStreaming ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleStop}
            title="Stop"
            className="synapse-ai-panel__send-btn"
          >
            <Square className="size-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSend}
            disabled={!input.trim()}
            title="Send"
            className="synapse-ai-panel__send-btn"
          >
            <SendHorizonal className="size-4" />
          </Button>
        )}
      </div>

      {/* ── safety note ─────────────────────────────────────────── */}
      <p className="synapse-ai-panel__disclaimer">
        AI can make mistakes. Review edits before inserting.
      </p>
    </aside>
  );
}
