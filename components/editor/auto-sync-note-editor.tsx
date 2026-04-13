"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Mathematics from "@tiptap/extension-mathematics";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { parseFrontmatterTitle } from "@/lib/notes-path";
import { cn } from "@/lib/utils";

type AutoSyncNoteEditorProps = {
  noteId: string;
  initialTitle: string;
  initialContent: string;
  initialFolderId: string | null;
};

type SyncState = "saving" | "saved" | "error";

type SavePayload = {
  title: string;
  folderId: string | null;
  content: string;
  contentText: string;
};

function normalizeTitle(title: string): string {
  const normalized = title.trim().slice(0, 180);
  return normalized || "Untitled";
}

function isLikelyHtml(input: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

async function toEditorHtml(content: string): Promise<string> {
  if (!content.trim()) {
    return "<p></p>";
  }

  if (isLikelyHtml(content)) {
    return content;
  }

  try {
    const file = await remark()
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype)
      .use(rehypeKatex)
      .use(rehypeStringify)
      .process(content);

    return String(file);
  } catch {
    return `<p>${content}</p>`;
  }
}

export default function AutoSyncNoteEditor({
  noteId,
  initialTitle,
  initialContent,
  initialFolderId,
}: AutoSyncNoteEditorProps) {
  const router = useRouter();
  const [derivedTitle, setDerivedTitle] = useState<string>(initialTitle || "Untitled");
  const [contentHtml, setContentHtml] = useState<string>("<p></p>");
  const [contentText, setContentText] = useState<string>("");
  const [initialHtml, setInitialHtml] = useState<string>("<p></p>");
  const [syncState, setSyncState] = useState<SyncState>("saved");
  const [isPreparingEditor, setIsPreparingEditor] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const hydrationDoneRef = useRef<boolean>(false);
  const lastSavedRef = useRef<SavePayload | null>(null);
  const saveSequenceRef = useRef<number>(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: "Use frontmatter at top to set title, e.g. ---\\ntitle: CoPC CP Contest\\n---",
      }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[68vh] w-full rounded-lg border bg-background px-5 py-4 text-base leading-7 outline-none",
          "prose prose-slate max-w-none",
          "prose-headings:font-semibold prose-headings:text-foreground",
          "prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground",
          "prose-pre:rounded-md prose-pre:border prose-pre:bg-muted/30",
          "prose-blockquote:border-l-2 prose-blockquote:text-muted-foreground",
          "dark:prose-invert",
        ),
      },
    },
    onUpdate({ editor: currentEditor }) {
      const nextHtml = currentEditor.getHTML();
      const nextText = currentEditor.getText();
      const frontmatterTitle = parseFrontmatterTitle(nextText);

      setContentHtml(nextHtml);
      setContentText(nextText);
      setDerivedTitle(normalizeTitle(frontmatterTitle ?? "Untitled"));
    },
  });

  useEffect(() => {
    let active = true;

    setDerivedTitle(initialTitle || "Untitled");
    setIsPreparingEditor(true);
    setIsHydrated(false);
    hydrationDoneRef.current = false;

    async function prepare(): Promise<void> {
      const prepared = await toEditorHtml(initialContent);

      if (!active) {
        return;
      }

      setInitialHtml(prepared);
      setIsPreparingEditor(false);
    }

    void prepare();

    return () => {
      active = false;
    };
  }, [initialContent, initialFolderId, initialTitle]);

  useEffect(() => {
    if (!editor || isPreparingEditor || hydrationDoneRef.current) {
      return;
    }

    editor.commands.setContent(initialHtml, {
      emitUpdate: false,
    });

    const initialPayload: SavePayload = {
      title: normalizeTitle(initialTitle || "Untitled"),
      folderId: initialFolderId ?? null,
      content: editor.getHTML(),
      contentText: editor.getText(),
    };

    setContentHtml(initialPayload.content);
    setContentText(initialPayload.contentText);
    lastSavedRef.current = initialPayload;
    hydrationDoneRef.current = true;
    setIsHydrated(true);
    setSyncState("saved");
  }, [editor, initialFolderId, initialHtml, initialTitle, isPreparingEditor]);

  const payload = useMemo<SavePayload>(
    () => ({
      title: normalizeTitle(derivedTitle),
      folderId: initialFolderId || null,
      content: contentHtml,
      contentText,
    }),
    [contentHtml, contentText, derivedTitle, initialFolderId],
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const previous = lastSavedRef.current;

    if (
      previous &&
      previous.title === payload.title &&
      previous.folderId === payload.folderId &&
      previous.content === payload.content &&
      previous.contentText === payload.contentText
    ) {
      return;
    }

    setSyncState("saving");

    const sequence = saveSequenceRef.current + 1;
    saveSequenceRef.current = sequence;

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Save failed");
        }

        const data = (await response.json()) as { privatePath?: string };

        if (sequence !== saveSequenceRef.current) {
          return;
        }

        if (typeof data.privatePath === "string" && data.privatePath.length > 0 && data.privatePath !== window.location.pathname) {
          router.replace(data.privatePath);
        }

        lastSavedRef.current = payload;
        setSyncState("saved");
      } catch {
        if (sequence !== saveSequenceRef.current) {
          return;
        }

        setSyncState("error");
      }
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isHydrated, noteId, payload, router]);

  const syncIndicator =
    syncState === "saving" ? (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Syncing...
      </span>
    ) : syncState === "error" ? (
      <span className="inline-flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="size-3.5" />
        Sync failed
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3.5" />
        All changes synced
      </span>
    );

  return (
    <section className="rounded-xl border bg-card p-4 text-card-foreground sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Back to workspace
        </Link>
        {syncIndicator}
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Title is read from frontmatter: <span className="font-mono">---</span> <span className="font-mono">title: ...</span> <span className="font-mono">---</span>
      </p>

      <div className="mt-4">
        {isPreparingEditor || !editor ? (
          <div className="min-h-[68vh] rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            Preparing editor...
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </section>
  );
}
