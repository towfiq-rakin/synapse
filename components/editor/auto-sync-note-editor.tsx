"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Extension, markInputRule } from "@tiptap/core";
import type { MarkType } from "@tiptap/pm/model";
import { EditorContent, EditorContext, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import {
  starInputRegex as boldStarInputRegex,
  underscoreInputRegex as boldUnderscoreInputRegex,
} from "@tiptap/extension-bold";
import { inputRegex as codeInputRegex } from "@tiptap/extension-code";
import {
  starInputRegex as italicStarInputRegex,
  underscoreInputRegex as italicUnderscoreInputRegex,
} from "@tiptap/extension-italic";
import { inputRegex as strikeInputRegex } from "@tiptap/extension-strike";
import { Selection } from "@tiptap/extensions";
import Mathematics from "@tiptap/extension-mathematics";
import matter from "gray-matter";
import { common, createLowlight } from "lowlight";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  SquareCheck,
  Tags,
  Type,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AppOptionsPopover } from "@/components/layout/app-options-popover";
import { Toolbar, ToolbarGroup, ToolbarSeparator } from "@/components/tiptap-ui-primitive/toolbar";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import { ColorHighlightPopover } from "@/components/tiptap-ui/color-highlight-popover";
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { LinkPopover } from "@/components/tiptap-ui/link-popover";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";
import { MarkdownMathInputExtension } from "@/components/tiptap-extension/markdown-math-input-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/editor/auto-sync-note-editor.scss";

type AutoSyncNoteEditorProps = {
  noteId: string;
  initialTitle: string;
  initialContent: string;
  initialFolderId: string | null;
};

type SavePayload = {
  title: string;
  folderId: string | null;
  content: string;
  contentText: string;
};

type NoteFrontmatterState = {
  title: string;
  date: string;
  tags: string;
  authors: string;
  draft: boolean;
};

type PreparedEditorContent = {
  content: string;
  contentType: "html" | "markdown";
};

type ParsedNoteContent = {
  editorContent: PreparedEditorContent;
  frontmatter: NoteFrontmatterState;
  hadFrontmatter: boolean;
};

type FrontmatterFieldKey = keyof NoteFrontmatterState;

type MarkdownMarkRuleConfig = {
  find: RegExp;
  type: MarkType;
};

const lowlight = createLowlight(common);
const EMPTY_FRONTMATTER: NoteFrontmatterState = {
  title: "",
  date: "",
  tags: "",
  authors: "",
  draft: false,
};

function normalizeTitle(title: string): string {
  const normalized = title.trim().slice(0, 180);
  return normalized || "Untitled";
}

function isLikelyHtml(input: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

function toEditorContent(content: string): PreparedEditorContent {
  if (!content.trim()) {
    return {
      content: "",
      contentType: "markdown",
    };
  }

  if (isLikelyHtml(content)) {
    return {
      content,
      contentType: "html",
    };
  }

  return {
    content,
    contentType: "markdown",
  };
}

function toListInput(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0)
      .join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function splitListInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toDateInput(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function toStringInput(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function toBooleanInput(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function parseNoteContent(rawContent: string): ParsedNoteContent {
  const normalized = rawContent.replace(/\r\n/g, "\n");
  const hasFrontmatter = matter.test(normalized);
  const parsed = matter(normalized);
  const data = parsed.data as Record<string, unknown>;

  return {
    editorContent: toEditorContent(parsed.content),
    frontmatter: {
      title: toStringInput(data.title),
      date: toDateInput(data.date),
      tags: toListInput(data.tags),
      authors: toListInput(data.authors),
      draft: toBooleanInput(data.draft),
    },
    hadFrontmatter: hasFrontmatter,
  };
}

function serializeNoteContent(
  frontmatterState: NoteFrontmatterState,
  markdownBody: string,
  hadFrontmatter: boolean,
): string {
  const data: Record<string, unknown> = {};
  const title = frontmatterState.title.trim();
  const date = frontmatterState.date.trim();
  const tags = splitListInput(frontmatterState.tags);
  const authors = splitListInput(frontmatterState.authors);

  if (title.length > 0) {
    data.title = title;
  }

  if (date.length > 0) {
    data.date = date;
  }

  if (tags.length > 0) {
    data.tags = tags;
  }

  if (authors.length > 0) {
    data.authors = authors;
  }

  if (frontmatterState.draft) {
    data.draft = true;
  }

  const shouldIncludeFrontmatter = hadFrontmatter || Object.keys(data).length > 0;
  if (!shouldIncludeFrontmatter) {
    return markdownBody;
  }

  const serializedBody = markdownBody.length > 0 ? markdownBody : "";
  return matter.stringify(serializedBody, data);
}

function toDownloadFilename(title: string, extension: "md" | "pdf"): string {
  const sanitizedBase = normalizeTitle(title)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return `${sanitizedBase || "note"}.${extension}`;
}

function downloadUtf8TextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPrintDocument(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page {
        size: A4;
        margin: 14mm 12mm;
      }

      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #111827;
        font-family: "Georgia", "Times New Roman", serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      body {
        padding: 16mm 0;
      }

      .print-note {
        width: min(100%, 760px);
        margin: 0 auto;
        padding: 0 8mm;
      }

      .print-note__title {
        margin: 0 0 1.4rem;
        font-size: 2rem;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }

      .print-note__content {
        font-size: 1rem;
        line-height: 1.7;
      }

      .print-note__content > * + * {
        margin-top: 1em;
      }

      .print-note__content h1,
      .print-note__content h2,
      .print-note__content h3,
      .print-note__content h4,
      .print-note__content h5,
      .print-note__content h6 {
        line-height: 1.2;
        margin-top: 1.5em;
        margin-bottom: 0.45em;
      }

      .print-note__content ul,
      .print-note__content ol {
        padding-left: 1.4rem;
      }

      .print-note__content blockquote {
        margin-left: 0;
        padding-left: 1rem;
        border-left: 3px solid #d1d5db;
        color: #374151;
      }

      .print-note__content pre {
        overflow-x: auto;
        padding: 0.9rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 0.8rem;
        background: #f8fafc;
        white-space: pre-wrap;
      }

      .print-note__content code {
        font-family: "SFMono-Regular", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
      }

      .print-note__content :not(pre) > code {
        padding: 0.12rem 0.35rem;
        border-radius: 0.35rem;
        background: #f3f4f6;
      }

      .print-note__content hr {
        border: 0;
        border-top: 1px solid #d1d5db;
        margin: 1.5rem 0;
      }

      .print-note__content a {
        color: #0f766e;
      }

      .print-note__content img {
        display: block;
        max-width: 100%;
        height: auto;
      }

      .print-note__content table {
        width: 100%;
        border-collapse: collapse;
      }

      .print-note__content th,
      .print-note__content td {
        border: 1px solid #d1d5db;
        padding: 0.55rem 0.7rem;
        text-align: left;
        vertical-align: top;
      }
    </style>
  </head>
  <body>
    <main class="print-note">
      <h1 class="print-note__title">${escapeHtml(title)}</h1>
      <article class="print-note__content">${bodyHtml}</article>
    </main>
    <script>
      window.addEventListener("load", () => {
        window.setTimeout(() => window.print(), 120);
      });
      window.addEventListener("afterprint", () => {
        window.close();
      });
    </script>
  </body>
</html>`;
}

function markdownMarkInputRule({ find, type }: MarkdownMarkRuleConfig) {
  return markInputRule({
    find,
    type,
  });
}

const ObsidianLiveMarkdown = Extension.create({
  name: "obsidianLiveMarkdown",
  priority: 1000,

  addInputRules() {
    const { bold, code, italic, strike } = this.editor.schema.marks;

    if (!bold || !italic || !strike || !code) {
      return [];
    }

    return [
      markdownMarkInputRule({
        find: boldStarInputRegex,
        type: bold,
      }),
      markdownMarkInputRule({
        find: boldUnderscoreInputRegex,
        type: bold,
      }),
      markdownMarkInputRule({
        find: strikeInputRegex,
        type: strike,
      }),
      markdownMarkInputRule({
        find: codeInputRegex,
        type: code,
      }),
      markdownMarkInputRule({
        find: italicStarInputRegex,
        type: italic,
      }),
      markdownMarkInputRule({
        find: italicUnderscoreInputRegex,
        type: italic,
      }),
    ];
  },
});

function NoteEditorToolbar({
  title,
  exportDisabled,
  onExportMarkdown,
  onExportPdf,
}: {
  title: string;
  exportDisabled: boolean;
  onExportMarkdown: () => void;
  onExportPdf: () => void;
}) {
  return (
    <div className="synapse-note-topbar">
      <div className="synapse-note-breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/notes">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title || "Untitled"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Toolbar className="synapse-note-toolbar">
        <ToolbarGroup>
          <UndoRedoButton action="undo" />
          <UndoRedoButton action="redo" />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
          <ListDropdownMenu modal={false} types={["bulletList", "orderedList", "taskList"]} />
          <BlockquoteButton />
          <CodeBlockButton />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <MarkButton type="bold" />
          <MarkButton type="italic" />
          <MarkButton type="strike" />
          <MarkButton type="code" />
          <MarkButton type="underline" />
          <ColorHighlightPopover />
          <LinkPopover />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <TextAlignButton align="left" />
          <TextAlignButton align="center" />
          <TextAlignButton align="right" />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <ImageUploadButton text="Add" />
        </ToolbarGroup>
      </Toolbar>

      <div className="synapse-note-actions">
        <SidebarTrigger className="md:hidden" />
        <ThemeToggle />
        <AppOptionsPopover
          exportDisabled={exportDisabled}
          onExportMarkdown={onExportMarkdown}
          onExportPdf={onExportPdf}
        />
      </div>
    </div>
  );
}

function NoteFrontmatterPanel({
  frontmatter,
  onFieldChange,
}: {
  frontmatter: NoteFrontmatterState;
  onFieldChange: <K extends keyof NoteFrontmatterState>(field: K, value: NoteFrontmatterState[K]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const [manuallyVisibleFields, setManuallyVisibleFields] = useState<FrontmatterFieldKey[]>([]);

  const fieldMeta: Record<
    FrontmatterFieldKey,
    { label: string; icon: LucideIcon; placeholder?: string }
  > = {
    title: { label: "title", icon: Type, placeholder: "Empty" },
    date: { label: "Date", icon: CalendarDays, placeholder: "YYYY-MM-DD" },
    tags: { label: "tags", icon: Tags, placeholder: "tag1, tag2" },
    authors: { label: "authors", icon: Users, placeholder: "author1, author2" },
    draft: { label: "draft", icon: SquareCheck },
  };

  const visibleFields = useMemo(() => {
    const next: FrontmatterFieldKey[] = ["title"];

    if (frontmatter.date.trim().length > 0) {
      next.push("date");
    }

    if (frontmatter.tags.trim().length > 0) {
      next.push("tags");
    }

    if (frontmatter.authors.trim().length > 0) {
      next.push("authors");
    }

    if (frontmatter.draft) {
      next.push("draft");
    }

    for (const field of manuallyVisibleFields) {
      if (!next.includes(field)) {
        next.push(field);
      }
    }

    return next;
  }, [
    frontmatter.authors,
    frontmatter.date,
    frontmatter.draft,
    frontmatter.tags,
    manuallyVisibleFields,
  ]);

  const addableFields = (Object.keys(fieldMeta) as FrontmatterFieldKey[]).filter(
    (key) => !visibleFields.includes(key),
  );

  function revealField(key: FrontmatterFieldKey) {
    setManuallyVisibleFields((previous) => (previous.includes(key) ? previous : [...previous, key]));
    setShowAddMenu(false);
  }

  return (
    <section className="synapse-note-properties" aria-label="Note properties">
      <button
        type="button"
        className="synapse-note-properties-header"
        onClick={() => setIsExpanded((previous) => !previous)}
      >
        {isExpanded ? (
          <ChevronDown className="synapse-note-properties-header-icon" />
        ) : (
          <ChevronRight className="synapse-note-properties-header-icon" />
        )}
        <span>Properties</span>
      </button>

      {isExpanded ? (
        <div className="synapse-note-properties-body">
          {visibleFields.map((fieldKey) => {
            const meta = fieldMeta[fieldKey];
            const Icon = meta.icon;

            return (
              <label key={fieldKey} className="synapse-note-property-row">
                <span className="synapse-note-property-key">
                  <Icon className="synapse-note-property-key-icon" />
                  {meta.label}
                </span>

                {fieldKey === "draft" ? (
                  <input
                    type="checkbox"
                    checked={frontmatter.draft}
                    onChange={(event) => onFieldChange("draft", event.target.checked)}
                    className="synapse-note-property-checkbox"
                  />
                ) : (
                  <input
                    value={frontmatter[fieldKey]}
                    onChange={(event) =>
                      onFieldChange(
                        fieldKey,
                        event.target.value as NoteFrontmatterState[typeof fieldKey],
                      )
                    }
                    placeholder={meta.placeholder}
                    className="synapse-note-property-input"
                  />
                )}
              </label>
            );
          })}

          {addableFields.length > 0 ? (
            <div className="synapse-note-property-add-wrap" onMouseLeave={() => setShowAddMenu(false)}>
              <button
                type="button"
                className="synapse-note-property-add"
                onClick={() => setShowAddMenu((previous) => !previous)}
              >
                <Plus className="synapse-note-property-add-icon" />
                Add property
              </button>

              {showAddMenu ? (
                <div className="synapse-note-property-add-menu">
                  {addableFields.map((field) => {
                    const Icon = fieldMeta[field].icon;
                    return (
                      <button
                        key={field}
                        type="button"
                        className="synapse-note-property-add-item"
                        onClick={() => revealField(field)}
                      >
                        <Icon className="synapse-note-property-add-item-icon" />
                        {fieldMeta[field].label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function AutoSyncNoteEditor({
  noteId,
  initialTitle,
  initialContent,
  initialFolderId,
}: AutoSyncNoteEditorProps) {
  const router = useRouter();
  const [derivedTitle, setDerivedTitle] = useState<string>(initialTitle || "Untitled");
  const [frontmatter, setFrontmatter] = useState<NoteFrontmatterState>(EMPTY_FRONTMATTER);
  const [initialEditorContent, setInitialEditorContent] = useState<PreparedEditorContent>({
    content: "",
    contentType: "markdown",
  });
  const [isPreparingEditor, setIsPreparingEditor] = useState<boolean>(true);

  const hydrationDoneRef = useRef<boolean>(false);
  const lastSavedRef = useRef<SavePayload | null>(null);
  const latestPayloadRef = useRef<SavePayload | null>(null);
  const saveSequenceRef = useRef<number>(0);
  const saveTimeoutRef = useRef<number | null>(null);
  const isHydratedRef = useRef<boolean>(false);
  const derivedTitleRef = useRef<string>(initialTitle || "Untitled");
  const frontmatterRef = useRef<NoteFrontmatterState>(EMPTY_FRONTMATTER);
  const hadFrontmatterRef = useRef<boolean>(false);
  const folderIdRef = useRef<string | null>(initialFolderId ?? null);
  const noteIdRef = useRef<string>(noteId);
  const routerRef = useRef(router);

  function scheduleSave(nextPayload?: SavePayload) {
    const payload = nextPayload ?? latestPayloadRef.current;

    if (!isHydratedRef.current || !payload) {
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

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    const sequence = saveSequenceRef.current + 1;
    saveSequenceRef.current = sequence;

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/notes/${noteIdRef.current}`, {
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
          routerRef.current.replace(data.privatePath);
        }

        lastSavedRef.current = payload;
      } catch {
        if (sequence !== saveSequenceRef.current) {
          return;
        }
      }
    }, 700);
  }

  function updateLatestPayloadFromEditor(currentEditor: Editor, title = derivedTitleRef.current) {
    const markdownBody = currentEditor.getMarkdown();
    const payload: SavePayload = {
      title: normalizeTitle(title),
      folderId: folderIdRef.current,
      content: serializeNoteContent(frontmatterRef.current, markdownBody, hadFrontmatterRef.current),
      contentText: currentEditor.getText(),
    };

    latestPayloadRef.current = payload;
    return payload;
  }

  function handleTitleChange(value: string) {
    setDerivedTitle(value);
    derivedTitleRef.current = value;

    if (!latestPayloadRef.current) {
      return;
    }

    const nextPayload = {
      ...latestPayloadRef.current,
      title: normalizeTitle(value),
    };

    latestPayloadRef.current = nextPayload;
    scheduleSave(nextPayload);
  }

  function handleTitleBlur() {
    const normalizedTitle = normalizeTitle(derivedTitleRef.current);

    setDerivedTitle(normalizedTitle);
    derivedTitleRef.current = normalizedTitle;

    if (!latestPayloadRef.current) {
      return;
    }

    const nextPayload = {
      ...latestPayloadRef.current,
      title: normalizedTitle,
    };

    latestPayloadRef.current = nextPayload;
    scheduleSave(nextPayload);
  }

  function handleFrontmatterFieldChange<K extends keyof NoteFrontmatterState>(field: K, value: NoteFrontmatterState[K]) {
    setFrontmatter((previous) => {
      const next = {
        ...previous,
        [field]: value,
      };

      frontmatterRef.current = next;
      hadFrontmatterRef.current = true;

      if (field === "title" && typeof value === "string") {
        const normalizedFromFrontmatter = normalizeTitle(value);
        setDerivedTitle(normalizedFromFrontmatter);
        derivedTitleRef.current = normalizedFromFrontmatter;
      }

      if (!latestPayloadRef.current || !editor) {
        return next;
      }

      const nextPayload: SavePayload = {
        ...latestPayloadRef.current,
        title: normalizeTitle(derivedTitleRef.current),
        content: serializeNoteContent(next, editor.getMarkdown(), hadFrontmatterRef.current),
      };

      latestPayloadRef.current = nextPayload;
      scheduleSave(nextPayload);
      return next;
    });
  }

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: false,
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        languageClassPrefix: "language-",
      }),
      HorizontalRule,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        enableClickSelection: true,
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      Placeholder.configure({
        placeholder: "Press '/' for ideas, or start writing...",
      }),
      Markdown.configure({
        markedOptions: {
          gfm: true,
          breaks: true,
        },
      }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
      MarkdownMathInputExtension,
      ObsidianLiveMarkdown,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Synapse note editor",
        class: "synapse-note-prosemirror",
      },
    },
    onUpdate({ editor: currentEditor }) {
      scheduleSave(updateLatestPayloadFromEditor(currentEditor, derivedTitleRef.current));
    },
  });

  useEffect(() => {
    noteIdRef.current = noteId;
    routerRef.current = router;
    folderIdRef.current = initialFolderId ?? null;
  }, [initialFolderId, noteId, router]);

  useEffect(() => {
    let active = true;
    const parsed = parseNoteContent(initialContent);
    const nextTitle = normalizeTitle(parsed.frontmatter.title || initialTitle || "Untitled");

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    setDerivedTitle(nextTitle);
    derivedTitleRef.current = nextTitle;
    setFrontmatter(parsed.frontmatter);
    frontmatterRef.current = parsed.frontmatter;
    hadFrontmatterRef.current = parsed.hadFrontmatter;
    folderIdRef.current = initialFolderId ?? null;
    setIsPreparingEditor(true);
    isHydratedRef.current = false;
    hydrationDoneRef.current = false;
    lastSavedRef.current = null;
    latestPayloadRef.current = null;

    if (active) {
      setInitialEditorContent(parsed.editorContent);
      setIsPreparingEditor(false);
    }

    return () => {
      active = false;
    };
  }, [initialContent, initialFolderId, initialTitle, noteId]);

  useEffect(() => {
    if (!editor || isPreparingEditor || hydrationDoneRef.current) {
      return;
    }

    editor.commands.setContent(initialEditorContent.content, {
      emitUpdate: false,
      contentType: initialEditorContent.contentType,
    });

    const initialPayload: SavePayload = {
      title: normalizeTitle(derivedTitleRef.current),
      folderId: initialFolderId ?? null,
      content: serializeNoteContent(frontmatterRef.current, editor.getMarkdown(), hadFrontmatterRef.current),
      contentText: editor.getText(),
    };

    latestPayloadRef.current = initialPayload;
    lastSavedRef.current = initialPayload;
    hydrationDoneRef.current = true;
    isHydratedRef.current = true;
  }, [editor, initialEditorContent, initialFolderId, initialTitle, isPreparingEditor]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  function handleExportMarkdown() {
    if (!editor) {
      toast.error("Editor is still loading.");
      return;
    }

    const payload = updateLatestPayloadFromEditor(editor, derivedTitleRef.current);
    downloadUtf8TextFile(toDownloadFilename(payload.title, "md"), payload.content);
  }

  function handleExportPdf() {
    if (!editor) {
      toast.error("Editor is still loading.");
      return;
    }

    const payload = updateLatestPayloadFromEditor(editor, derivedTitleRef.current);
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      toast.error("Pop-up blocked. Allow pop-ups to export PDF.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintDocument(payload.title, editor.getHTML()));
    printWindow.document.close();
  }

  return (
    <section className="synapse-note-shell">
      <EditorContext.Provider value={{ editor }}>
        <div className="synapse-note-chrome">
          <NoteEditorToolbar
            title={derivedTitle}
            exportDisabled={isPreparingEditor || !editor}
            onExportMarkdown={handleExportMarkdown}
            onExportPdf={handleExportPdf}
          />
        </div>

        <article className="synapse-note-page">
          <input
            value={derivedTitle}
            onChange={(event) => handleTitleChange(event.target.value)}
            onBlur={handleTitleBlur}
            aria-label="Note title"
            placeholder="Untitled"
            className="synapse-note-title"
          />

          <NoteFrontmatterPanel frontmatter={frontmatter} onFieldChange={handleFrontmatterFieldChange} />

          {isPreparingEditor || !editor ? (
            <div className="synapse-note-loading">
              <Loader2 className="size-4 animate-spin" />
              Preparing editor
            </div>
          ) : (
            <EditorContent editor={editor} className="synapse-note-content" />
          )}
        </article>
      </EditorContext.Provider>
    </section>
  );
}
