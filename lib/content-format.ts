const MARKDOWN_ONLY_PATTERNS = [
  /^---\s*$/m,
  /^#{1,6}\s/m,
  /^\s*[-*+]\s/m,
  /^\s*\d+\.\s/m,
  /(^|\n)\s*```/,
  /!\[[^\]]*]\([^)]+\)/,
  /\[[^\]]+]\([^)]+\)/,
  /^\s*>/m,
  /^\s*\|.+\|/m,
  /\*\*[^*]+\*\*/,
] as const;

export function looksLikeLegacyHtmlDocument(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed.startsWith("<")) {
    return false;
  }

  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return false;
  }

  return !MARKDOWN_ONLY_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function escapeMarkdownImageText(value: string) {
  return value.replace(/[[\]\\]/g, "\\$&");
}

function escapeMarkdownImageUrl(value: string) {
  return value.replace(/[()\\]/g, "\\$&");
}

function escapeMarkdownImageTitle(value: string) {
  return value.replace(/["\\]/g, "\\$&");
}

function getImageTagAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  const rawValue = match?.[2] ?? match?.[3] ?? match?.[4];

  if (!rawValue) {
    return null;
  }

  return decodeHtmlAttribute(rawValue.trim());
}

export function normalizeEmbeddedImageTags(value: string) {
  return value.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = getImageTagAttribute(tag, "src");

    if (!src) {
      return tag;
    }

    const alt = getImageTagAttribute(tag, "alt") ?? "";
    const title = getImageTagAttribute(tag, "title");

    const altText = escapeMarkdownImageText(alt);
    const url = escapeMarkdownImageUrl(src);

    if (title) {
      return `![${altText}](${url} "${escapeMarkdownImageTitle(title)}")`;
    }

    return `![${altText}](${url})`;
  });
}

function isListItemLine(value: string) {
  return /^(\s*)(?:[-+*]|\d+\.)\s+/.test(value);
}

function getLeadingSpaces(value: string) {
  const match = value.match(/^ */);
  return match?.[0].length ?? 0;
}

export function normalizeListAttachedCodeFences(value: string) {
  const lines = value.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!isListItemLine(line)) {
      continue;
    }

    const listIndent = getLeadingSpaces(line);
    let probe = index + 1;

    while (probe < lines.length && lines[probe]?.trim() === "") {
      probe += 1;
    }

    const fenceLine = lines[probe];

    if (!fenceLine) {
      continue;
    }

    const fenceIndent = getLeadingSpaces(fenceLine);

    if (fenceIndent !== listIndent + 2 || !fenceLine.trimStart().startsWith("```")) {
      continue;
    }

    const targetIndent = " ".repeat(listIndent + 3);
    let cursor = probe;

    while (cursor < lines.length) {
      const current = lines[cursor] ?? "";

      if (current.trim() === "") {
        lines[cursor] = targetIndent;
        cursor += 1;
        continue;
      }

      if (getLeadingSpaces(current) < fenceIndent) {
        break;
      }

      if (current.startsWith(" ".repeat(fenceIndent))) {
        lines[cursor] = `${targetIndent}${current.slice(fenceIndent)}`;
      }

      const isClosingFence = cursor > probe && current.trimStart().startsWith("```");
      cursor += 1;

      if (isClosingFence) {
        break;
      }
    }

    index = cursor - 1;
  }

  return lines.join("\n");
}

export function normalizeMarkdownForRendering(value: string) {
  return normalizeEmbeddedImageTags(normalizeListAttachedCodeFences(value));
}
