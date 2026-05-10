import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import sanitizeHtml from "sanitize-html";
import { getOptimizedCloudinaryImageUrl } from "@/lib/cloudinary";
import { looksLikeLegacyHtmlDocument, normalizeMarkdownForRendering } from "@/lib/content-format";

export type PublicNoteTocItem = {
  id: string;
  text: string;
  level: number;
};

export type RenderPublicNoteInput = {
  title: string;
  content?: string | null;
  contentText?: string | null;
};

export type RenderPublicNoteResult = {
  html: string;
  markdown: string | null;
  toc: PublicNoteTocItem[];
};

const EMPTY_NOTE_HTML = "<p>This note is empty.</p>";
const TOC_MIN_LEVEL = 2;
const TOC_MAX_LEVEL = 4;
const SAFE_TAGS = [
  "a",
  "annotation",
  "annotation-xml",
  "blockquote",
  "br",
  "code",
  "del",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "input",
  "li",
  "math",
  "mi",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mroot",
  "mrow",
  "mspace",
  "msqrt",
  "mstyle",
  "msub",
  "msubsup",
  "msup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "ol",
  "p",
  "path",
  "pre",
  "semantics",
  "span",
  "strong",
  "svg",
  "table",
  "tbody",
  "td",
  "thead",
  "th",
  "tr",
  "ul",
] as const;

const SAFE_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  code: ["class"],
  div: ["class"],
  h1: ["id"],
  h2: ["id"],
  h3: ["id"],
  h4: ["id"],
  h5: ["id"],
  h6: ["id"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  input: ["checked", "disabled", "type"],
  li: ["class"],
  math: ["display", "xmlns"],
  ol: ["class"],
  span: ["aria-hidden", "class", "style"],
  svg: ["aria-hidden", "focusable", "height", "viewBox", "width", "xmlns"],
  path: ["d", "fill", "stroke", "stroke-width"],
  ul: ["class"],
  annotation: ["encoding"],
};

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href);
}

function normalizePublicHref(rawHref: string): string | null {
  const value = rawHref.trim().replace(/^<|>$/g, "");

  if (
    !value ||
    /\s/.test(value) ||
    /^(?:javascript|data|vbscript):/i.test(value) ||
    /[\[\]()<>]/.test(value)
  ) {
    return null;
  }

  if (value.startsWith("/")) {
    return value;
  }

  if (/^mailto:/i.test(value)) {
    return value;
  }

  if (/^www\./i.test(value)) {
    return `https://${value}`;
  }

  const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);

  if (hasExplicitScheme && !/^https?:\/\//i.test(value)) {
    return null;
  }

  if (!hasExplicitScheme) {
    if (value.startsWith("//")) {
      return null;
    }

    return value;
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

function stripHtmlToText(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizePublicHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...SAFE_TAGS],
    allowedAttributes: SAFE_ATTRIBUTES,
    allowedStyles: {
      span: {
        top: [/^-?\d+(?:\.\d+)?(?:em|px|r?em|vh|vw|%)$/],
        height: [/^-?\d+(?:\.\d+)?(?:em|px|r?em|vh|vw|%)$/],
        "vertical-align": [/^-?\d+(?:\.\d+)?(?:em|px|r?em|vh|vw|%)$/, /^[-a-z]+$/],
        "margin-left": [/^-?\d+(?:\.\d+)?(?:em|px|r?em|vh|vw|%)$/],
        "margin-right": [/^-?\d+(?:\.\d+)?(?:em|px|r?em|vh|vw|%)$/],
        position: [/^(?:absolute|relative)$/],
        "font-size": [/^-?\d+(?:\.\d+)?(?:em|px|r?em|vh|vw|%)$/]
      }
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: true,
    transformTags: {
      a: (tagName: string, attributes: Record<string, string>) => {
        const href = typeof attributes.href === "string" ? attributes.href : "";
        const normalizedHref = normalizePublicHref(href);
        const nextAttributes = { ...attributes };

        if (!normalizedHref) {
          delete nextAttributes.href;
          delete nextAttributes.target;
          delete nextAttributes.rel;

          return { tagName, attribs: nextAttributes };
        }

        nextAttributes.href = normalizedHref;

        if (isExternalHref(normalizedHref)) {
          nextAttributes.target = "_blank";
          nextAttributes.rel = "noopener noreferrer";
        } else {
          delete nextAttributes.target;
          delete nextAttributes.rel;
        }

        return { tagName, attribs: nextAttributes };
      },
      img: (tagName: string, attributes: Record<string, string>) => ({
        tagName,
        attribs: {
          ...attributes,
          src: getOptimizedCloudinaryImageUrl(attributes.src ?? ""),
          loading: "lazy",
        },
      }),
    },
  });
}

function decorateLegacyHtml(html: string): { html: string; toc: PublicNoteTocItem[] } {
  const slugger = new GithubSlugger();
  const toc: PublicNoteTocItem[] = [];

  const decoratedHtml = html.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_match, levelRaw, attrs, innerHtml) => {
    const level = Number(levelRaw);
    const text = stripHtmlToText(innerHtml);
    const id = slugger.slug(text || `section-${level}`);

    if (level >= TOC_MIN_LEVEL && level <= TOC_MAX_LEVEL && text) {
      toc.push({ id, text, level });
    }

    return `<h${level}${attrs} id="${id}">${innerHtml} <a href="#${id}" rel="nofollow" title="Copy heading link">#</a></h${level}>`;
  });

  return {
    html: decoratedHtml || EMPTY_NOTE_HTML,
    toc,
  };
}

function getMarkdownSource(content: string, contentText: string, title: string): string {
  const normalizedContent = normalizeLineEndings(content).trim();

  if (normalizedContent.length === 0) {
    return normalizeLineEndings(contentText).trim() || title.trim();
  }

  const parsed = matter(normalizedContent);
  return normalizeLineEndings(parsed.content).trim();
}

async function renderMarkdownHtml(markdown: string): Promise<{ html: string; toc: PublicNoteTocItem[] }> {
  const file = await remark()
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .use(rehypeKatex as any, {
      throwOnError: false,
      output: "html",
    })
    .use(rehypeHighlight, {
      detect: false,
      ignoreMissing: true,
    })
    .use(rehypeStringify)
    .process(normalizeMarkdownForRendering(markdown));

  const html = sanitizePublicHtml(String(file).trim());
  const decorated = decorateLegacyHtml(html);

  return {
    html: decorated.html,
    toc: decorated.toc,
  };
}

export async function renderPublicNote({
  title,
  content,
  contentText,
}: RenderPublicNoteInput): Promise<RenderPublicNoteResult> {
  const resolvedTitle = title.trim() || "Untitled";
  const rawContent = normalizeLineEndings(content ?? "");
  const resolvedContentText = normalizeLineEndings(contentText ?? "");

  if (rawContent.trim() && looksLikeLegacyHtmlDocument(rawContent)) {
    const sanitizedHtml = sanitizePublicHtml(rawContent);
    const decorated = decorateLegacyHtml(sanitizedHtml);

    return {
      html: decorated.html,
      markdown: null,
      toc: decorated.toc,
    };
  }

  const markdown = getMarkdownSource(rawContent, resolvedContentText, resolvedTitle);
  const rendered = await renderMarkdownHtml(markdown);

  return {
    html: rendered.html,
    markdown,
    toc: rendered.toc,
  };
}
