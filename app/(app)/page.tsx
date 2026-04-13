"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorMenu } from "@/components/editor/editor-menu";
import { EDITOR_MENU_USERS } from "@/components/editor/editor-menu-users";

type DemoUser = (typeof EDITOR_MENU_USERS)[number];
type ExportFormat = "pdf" | "docx" | "odt";

function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default function AppIndexPage() {
  const editor = useCreateBlockNote();
  const [activeUser, setActiveUser] = useState<DemoUser>(EDITOR_MENU_USERS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const didInitializeRef = useRef(false);

  useEffect(() => {
    if (didInitializeRef.current) {
      return;
    }

    didInitializeRef.current = true;

    editor.replaceBlocks(editor.document, [
      {
        type: "heading",
        content: "Welcome to Synapse!",
      },
      {
        type: "paragraph",
      },
      {
        type: "paragraph",
        content:
          "This editor is configured for single-user writing with share and export controls.",
      },
      {
        type: "paragraph",
      },
      {
        type: "paragraph",
        content: "Type / to open commands.",
      },
    ]);
  }, [editor]);

  const handleExport = useCallback(
    (format: ExportFormat) => {
      if (format === "pdf") {
        const html = editor.blocksToHTMLLossy(editor.document);
        const printWindow = window.open("", "_blank", "noopener,noreferrer");

        if (!printWindow) {
          return;
        }

        printWindow.document.write(`
          <!doctype html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>${document.title || "BlockNote Export"}</title>
              <style>
                body { margin: 32px; font-family: ui-sans-serif, system-ui, sans-serif; }
              </style>
            </head>
            <body>${html}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        return;
      }

      if (format === "docx") {
        const markdown = editor.blocksToMarkdownLossy(editor.document);
        downloadFile(markdown, "note-export.md", "text/markdown;charset=utf-8");
        return;
      }

      const html = editor.blocksToHTMLLossy(editor.document);
      downloadFile(html, "note-export.html", "text/html;charset=utf-8");
    },
    [editor],
  );

  return (
    <section className="min-h-screen w-full bg-stone-100/80 px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex h-[calc(100vh-2rem)] min-h-140 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl sm:h-[calc(100vh-3rem)]">
          <div className="flex min-w-0 flex-1 flex-col">
            <EditorMenu
              onExport={handleExport}
              user={activeUser}
              setUser={setActiveUser}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((current) => !current)}
            />

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
              <div className="mx-auto w-full max-w-215">
                <BlockNoteView editor={editor} theme="light" />
              </div>
            </div>
          </div>

          <aside
            className={`hidden border-l border-stone-200 bg-stone-50/70 transition-all duration-200 md:block ${
              sidebarOpen ? "w-64 p-4" : "w-0 overflow-hidden p-0"
            }`}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Editor Info
            </h2>
            <p className="mt-3 text-sm text-stone-700">Single-user mode enabled.</p>
            <p className="mt-2 text-sm text-stone-600">
              Collaboration and comments are intentionally disabled on this page.
            </p>
            <p className="mt-4 text-xs text-stone-500">
              Use Share to copy the current URL and Export to print as PDF or download Markdown/HTML.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
