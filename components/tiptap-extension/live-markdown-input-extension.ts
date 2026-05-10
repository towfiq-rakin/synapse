import {
  Extension,
  InputRule,
  PasteRule,
  markInputRule,
  markPasteRule,
  nodeInputRule,
  textblockTypeInputRule,
  wrappingInputRule,
} from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import {
  starInputRegex as boldStarInputRegex,
  starPasteRegex as boldStarPasteRegex,
  underscoreInputRegex as boldUnderscoreInputRegex,
  underscorePasteRegex as boldUnderscorePasteRegex,
} from "@tiptap/extension-bold";
import {
  inputRegex as codeInputRegex,
  pasteRegex as codePasteRegex,
} from "@tiptap/extension-code";
import { backtickInputRegex as codeBlockBacktickInputRegex } from "@tiptap/extension-code-block";
<<<<<<< HEAD
=======
import { inputRegex as blockquoteInputRegex } from "@tiptap/extension-blockquote";
>>>>>>> main
import {
  starInputRegex as italicStarInputRegex,
  starPasteRegex as italicStarPasteRegex,
  underscoreInputRegex as italicUnderscoreInputRegex,
  underscorePasteRegex as italicUnderscorePasteRegex,
} from "@tiptap/extension-italic";
<<<<<<< HEAD
import { inputRegex as blockquoteInputRegex } from "@tiptap/extension-blockquote";
import { isAllowedUri } from "@tiptap/extension-link";
=======
>>>>>>> main
import {
  bulletListInputRegex,
  inputRegex as taskItemInputRegex,
  orderedListInputRegex,
} from "@tiptap/extension-list";
import {
  inputRegex as strikeInputRegex,
  pasteRegex as strikePasteRegex,
} from "@tiptap/extension-strike";

const headingInputRegexes: Array<{ level: 1 | 2 | 3 | 4; find: RegExp }> = [
  { level: 1, find: /^#\s$/ },
  { level: 2, find: /^##\s$/ },
  { level: 3, find: /^###\s$/ },
  { level: 4, find: /^####\s$/ },
];

const horizontalRuleInputRegex = /^(?:---|\*\*\*)\s?$/;
const markdownLinkInputRegex = /\[([^\]\n]+)]\(([^\s)]+)\)$/;
const markdownLinkPasteRegex = /\[([^\]\n]+)]\(([^\s)]+)\)/g;
<<<<<<< HEAD
=======
const BAD_PROTOCOL_REGEX = /^(?:javascript|data|vbscript):/i;
const ILLEGAL_HREF_CHARS_REGEX = /[\[\]()<>]/;
>>>>>>> main

function isInCodeContext(state: Parameters<InputRule["handler"]>[0]["state"], from: number): boolean {
  const $from = state.doc.resolve(from);

  if ($from.parent.type.spec.code) {
    return true;
  }

  const codeMark = state.schema.marks.code;

  return Boolean(codeMark && $from.marks().some((mark) => mark.type === codeMark));
}

<<<<<<< HEAD
function toSafeHref(raw: string): string | null {
  const trimmed = raw.trim().replace(/^<|>$/g, "");

  if (!trimmed) {
    return null;
  }

  return isAllowedUri(trimmed) ? trimmed : null;
=======
export function normalizeMarkdownHref(rawHref: string): string | null {
  const value = rawHref.trim().replace(/^<|>$/g, "");

  if (!value || /\s/.test(value) || BAD_PROTOCOL_REGEX.test(value) || ILLEGAL_HREF_CHARS_REGEX.test(value)) {
    return null;
  }

  if (value.startsWith("/")) {
    return value;
  }

  if (/^www\./i.test(value)) {
    return `https://${value}`;
  }

  if (/^mailto:/i.test(value)) {
    return value;
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
>>>>>>> main
}

function applyMarkdownLink(
  state: Parameters<InputRule["handler"]>[0]["state"],
  range: { from: number; to: number },
  match: RegExpMatchArray,
  placeCursorAtEnd: boolean,
): boolean {
  if (isInCodeContext(state, range.from)) {
    return false;
  }

  const label = match[1]?.trim();
<<<<<<< HEAD
  const href = toSafeHref(match[2] ?? "");
=======
  const href = normalizeMarkdownHref(match[2] ?? "");
>>>>>>> main
  const linkType = state.schema.marks.link;

  if (!label || !href || !linkType) {
    return false;
  }

  const node = state.schema.text(label, [linkType.create({ href })]);

  state.tr.replaceWith(range.from, range.to, node);

  if (placeCursorAtEnd) {
    state.tr.setSelection(TextSelection.create(state.tr.doc, range.from + label.length));
  }

  return true;
}

export const LiveMarkdownInputExtension = Extension.create({
  name: "liveMarkdownInputExtension",

  addInputRules() {
    const { bold, code, italic, strike } = this.editor.schema.marks;
    const {
      blockquote,
      bulletList,
      codeBlock,
      heading,
      horizontalRule,
      orderedList,
      taskItem,
    } = this.editor.schema.nodes;

    const rules: InputRule[] = [];

    if (bold) {
      rules.push(markInputRule({ find: boldStarInputRegex, type: bold }));
      rules.push(markInputRule({ find: boldUnderscoreInputRegex, type: bold }));
    }

    if (italic) {
      rules.push(markInputRule({ find: italicStarInputRegex, type: italic }));
      rules.push(markInputRule({ find: italicUnderscoreInputRegex, type: italic }));
    }

    if (strike) {
      rules.push(markInputRule({ find: strikeInputRegex, type: strike }));
    }

    if (code) {
      rules.push(markInputRule({ find: codeInputRegex, type: code }));
    }

    if (heading) {
      headingInputRegexes.forEach(({ find, level }) => {
        rules.push(textblockTypeInputRule({ find, type: heading, getAttributes: { level } }));
      });
    }

    if (blockquote) {
      rules.push(wrappingInputRule({ find: blockquoteInputRegex, type: blockquote }));
    }

    if (bulletList) {
      rules.push(wrappingInputRule({ find: bulletListInputRegex, type: bulletList }));
    }

    if (orderedList) {
      rules.push(
        wrappingInputRule({
          find: orderedListInputRegex,
          type: orderedList,
          getAttributes: (match) => ({
            start: Number(match[1]),
          }),
        }),
      );
    }

    if (taskItem) {
      rules.push(
        wrappingInputRule({
          find: taskItemInputRegex,
          type: taskItem,
          getAttributes: (match) => ({
            checked: (match[2] ?? "").toLowerCase() === "x",
          }),
        }),
      );
    }

    if (horizontalRule) {
      rules.push(nodeInputRule({ find: horizontalRuleInputRegex, type: horizontalRule }));
    }

    if (codeBlock) {
      rules.push(
        textblockTypeInputRule({
          find: codeBlockBacktickInputRegex,
          type: codeBlock,
          getAttributes: (match) => ({
            language: (match[1] ?? null) as string | null,
          }),
        }),
      );
    }

    rules.push(
      new InputRule({
        find: markdownLinkInputRegex,
        handler: ({ state, range, match }) => {
          applyMarkdownLink(state, range, match, true);
        },
      }),
    );

    return rules;
  },

  addPasteRules() {
    const { bold, code, italic, strike } = this.editor.schema.marks;

    const rules: PasteRule[] = [];

    if (bold) {
      rules.push(markPasteRule({ find: boldStarPasteRegex, type: bold }));
      rules.push(markPasteRule({ find: boldUnderscorePasteRegex, type: bold }));
    }

    if (italic) {
      rules.push(markPasteRule({ find: italicStarPasteRegex, type: italic }));
      rules.push(markPasteRule({ find: italicUnderscorePasteRegex, type: italic }));
    }

    if (strike) {
      rules.push(markPasteRule({ find: strikePasteRegex, type: strike }));
    }

    if (code) {
      rules.push(markPasteRule({ find: codePasteRegex, type: code }));
    }

    rules.push(
      new PasteRule({
        find: markdownLinkPasteRegex,
        handler: ({ state, range, match }) => {
          applyMarkdownLink(state, range, match, false);
        },
      }),
    );

    return rules;
  },
});
