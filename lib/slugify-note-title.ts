import slugify from "slugify";

const MARKDOWN_LINK_REGEX = /\[([^\]\n]+)]\(([^)\s]+)\)/g;
const INLINE_URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s<>()]+/gi;

function stripMarkdownFormatting(value: string): string {
  return value
    .replace(MARKDOWN_LINK_REGEX, "$1")
    .replace(INLINE_URL_REGEX, " ")
    .replace(/(\*\*|__)([^\n]+?)\1/g, "$2")
    .replace(/(\*|_)([^\n]+?)\1/g, "$2")
    .replace(/~~([^\n]+?)~~/g, "$1")
    .replace(/`([^\n`]+?)`/g, "$1")
    .replace(/[\[\](){}<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyNoteTitle(input: string, fallback = "untitled"): string {
  const sanitized = stripMarkdownFormatting(input);

  const computed = slugify(sanitized, {
    lower: true,
    strict: true,
    trim: true,
  });

  return computed || fallback;
}
