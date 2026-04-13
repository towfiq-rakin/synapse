"use client";

import { useEffect, useRef, useState } from "react";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

let mermaidInitialized = false;

type EditorMode = "write" | "preview";

export type SimpleMarkdownEditorProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
};

type MermaidTarget = {
  pre: HTMLPreElement;
  source: string;
};

function getMermaidTargets(root: HTMLElement): MermaidTarget[] {
  return Array.from(root.querySelectorAll<HTMLPreElement>("pre"))
    .map((pre) => {
      const code = pre.querySelector("code.language-mermaid");

      if (!code) {
        return null;
      }

      const source = code.textContent?.trim() ?? "";

      if (!source) {
        return null;
      }

      return { pre, source };
    })
    .filter((value): value is MermaidTarget => value !== null);
}

async function renderMermaidDiagrams(root: HTMLElement, isActive: () => boolean): Promise<void> {
  const targets = getMermaidTargets(root);

  if (targets.length === 0) {
    return;
  }

  const mermaidModule = await import("mermaid");
  const mermaid = mermaidModule.default;

  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
      suppressErrorRendering: true,
    });

    mermaidInitialized = true;
  }

  for (const [index, target] of targets.entries()) {
    if (!isActive()) {
      return;
    }

    const host = document.createElement("div");
    host.className = "overflow-x-auto rounded-md border bg-muted/20 p-3";
    target.pre.replaceWith(host);

    try {
      const diagramId = `mermaid-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`;
      const { svg, bindFunctions } = await mermaid.render(diagramId, target.source);

      if (!isActive()) {
        return;
      }

      host.innerHTML = svg;
      bindFunctions?.(host);
    } catch {
      host.className = "rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive";
      host.textContent = "Unable to render Mermaid diagram. Check the diagram syntax.";
    }
  }
}

export default function SimpleMarkdownEditor({
  id,
  name,
  defaultValue = "",
  placeholder,
  rows = 14,
  className,
}: SimpleMarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>("write");
  const [markdown, setMarkdown] = useState<string>(defaultValue);
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMarkdown(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    let active = true;
    const markdownSource = markdown.trim().length === 0 ? "_Nothing to preview yet._" : markdown;

    setIsRenderingPreview(true);

    async function buildPreview(): Promise<void> {
      try {
        const file = await remark()
          .use(remarkGfm)
          .use(remarkMath)
          .use(remarkRehype)
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(markdownSource);

        if (!active) {
          return;
        }

        setRenderedHtml(String(file));
        setRenderError(null);
      } catch {
        if (!active) {
          return;
        }

        setRenderedHtml("");
        setRenderError("Preview could not be rendered.");
      } finally {
        if (active) {
          setIsRenderingPreview(false);
        }
      }
    }

    void buildPreview();

    return () => {
      active = false;
    };
  }, [markdown]);

  useEffect(() => {
    let active = true;

    if (renderError || !previewRef.current) {
      return;
    }

    async function applyMermaid(): Promise<void> {
      if (!previewRef.current) {
        return;
      }

      try {
        await renderMermaidDiagrams(previewRef.current, () => active);
      } catch {
        // Mermaid errors are handled per-diagram above; ignore top-level failures.
      }
    }

    void applyMermaid();

    return () => {
      active = false;
    };
  }, [renderedHtml, renderError]);

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Supports Markdown, KaTeX math ($...$ / $$...$$), and Mermaid code fences.
        </p>

        <div className="flex items-center gap-2 lg:hidden">
          <Button
            type="button"
            size="sm"
            variant={mode === "write" ? "default" : "outline"}
            onClick={() => setMode("write")}
          >
            Write
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "default" : "outline"}
            onClick={() => setMode("preview")}
          >
            Preview
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cn("space-y-2", mode === "preview" && "hidden lg:block")}>
          <p className="text-xs font-medium text-muted-foreground">Markdown</p>
          <Textarea
            id={id}
            name={name}
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            rows={rows}
            placeholder={placeholder}
            className="min-h-72 font-mono text-sm leading-6"
          />
        </div>

        <div className={cn("space-y-2", mode === "write" && "hidden lg:block")}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Live preview</p>
            {isRenderingPreview ? <p className="text-xs text-muted-foreground">Rendering...</p> : null}
          </div>

          {renderError ? (
            <div className="min-h-72 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {renderError}
            </div>
          ) : (
            <div
              ref={previewRef}
              className={cn(
                "min-h-72 rounded-md border bg-muted/10 p-3 text-sm leading-6",
                "[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold",
                "[&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold",
                "[&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold",
                "[&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
                "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5",
                "[&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:bg-background [&_pre]:p-3",
                "[&_a]:text-primary [&_a]:underline",
                "[&_blockquote]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
                "[&_table]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:px-2 [&_td]:py-1",
              )}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </div>
      </div>
    </section>
  );
}