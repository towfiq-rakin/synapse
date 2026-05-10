"use client";

import { useEffect, useState } from "react";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import sanitizeHtml from "sanitize-html";

const processor = remark()
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeHighlight, { detect: false, ignoreMissing: true })
  .use(rehypeStringify);

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "em", "b", "i", "s", "del", "code", "pre",
    "blockquote", "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "h5", "h6",
    "hr", "table", "thead", "tbody", "tr", "th", "td", "span", "div",
    "input",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    code: ["class"],
    span: ["class"],
    pre: ["class"],
    input: ["type", "checked", "disabled"],
    th: ["align"],
    td: ["align"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

/**
 * Renders a Markdown string as sanitized HTML.
 * Uses the same remark/rehype stack as the rest of the app.
 */
export function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    if (!content.trim()) {
      queueMicrotask(() => {
        if (!cancelled) setHtml("");
      });
      return;
    }

    processor.process(content).then((file) => {
      if (!cancelled) {
        setHtml(sanitizeHtml(String(file), SANITIZE_OPTIONS));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [content]);

  if (!html) {
    // Fallback while processing (or empty content)
    return (
      <div className={className} style={{ whiteSpace: "pre-wrap" }}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
