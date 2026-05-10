import { Extension, InputRule, PasteRule } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { EditorState, Plugin } from "@tiptap/pm/state"
import type { NodeType, Schema } from "@tiptap/pm/model"

const INLINE_MATH_INPUT_REGEX = /(?<!\\)(?<!\$)\$([^\s$](?:[^$\n]*[^\s$])?)\$(?!\$)$/
const INLINE_MATH_PASTE_REGEX = /(?<!\\)(?<!\$)\$([^\s$](?:[^$\n]*[^\s$])?)\$(?!\$)/g
const BLOCK_MATH_INPUT_REGEX = /^\$\$([^$\n][\s\S]*[^$\n]|[^$\n])\$\$$/
const BLOCK_MATH_PASTE_REGEX = /(?<!\\)\$\$([\s\S]*?)\$\$/g

function getInlineMathType(schema: Schema): NodeType | null {
  return schema.nodes.inlineMath ?? schema.nodes.math ?? null
}

function getBlockMathType(schema: Schema): NodeType | null {
  return schema.nodes.blockMath ?? schema.nodes.math ?? null
}

function isMathNodeName(name: string): boolean {
  return name === "inlineMath" || name === "blockMath" || name === "math" || name === "mathematics"
}

function isInsideCodeContext(state: EditorState, from: number): boolean {
  const $from = state.doc.resolve(from)

  if ($from.parent.type.spec.code || $from.parent.type.name === "codeBlock") {
    return true
  }

  if ($from.marks().some((mark) => mark.type.name === "code")) {
    return true
  }

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)

    if (node.type.spec.code || node.type.name === "codeBlock" || isMathNodeName(node.type.name)) {
      return true
    }
  }

  return false
}

function sanitizeLatex(raw: string): string | null {
  const latex = raw.trim()

  if (!latex) {
    return null
  }

  return latex
}

function looksLikeCurrency(raw: string): boolean {
  return /^\d+(?:[.,]\d+)?$/.test(raw.trim())
}

function createInlineMathInputRule() {
  return new InputRule({
    find: INLINE_MATH_INPUT_REGEX,
    handler: ({ state, range, match }) => {
      const inlineMathType = getInlineMathType(state.schema)

      if (!inlineMathType || isInsideCodeContext(state, range.from)) {
        return
      }

      const latex = sanitizeLatex(match[1] ?? "")

      if (!latex || looksLikeCurrency(latex)) {
        return
      }

      state.tr.replaceWith(range.from, range.to, inlineMathType.create({ latex }))
    },
  })
}

function createBlockMathInputRule() {
  return new InputRule({
    find: BLOCK_MATH_INPUT_REGEX,
    handler: ({ state, range, match }) => {
      const blockMathType = getBlockMathType(state.schema)

      if (!blockMathType || isInsideCodeContext(state, range.from)) {
        return
      }

      const latex = sanitizeLatex(match[1] ?? "")

      if (!latex) {
        return
      }

      state.tr.replaceWith(range.from, range.to, blockMathType.create({ latex }))
    },
  })
}

function createInlineMathPasteRule() {
  return new PasteRule({
    find: INLINE_MATH_PASTE_REGEX,
    handler: ({ state, range, match }) => {
      const inlineMathType = getInlineMathType(state.schema)

      if (!inlineMathType || isInsideCodeContext(state, range.from)) {
        return
      }

      const latex = sanitizeLatex(match[1] ?? "")

      if (!latex || looksLikeCurrency(latex)) {
        return
      }

      state.tr.replaceWith(range.from, range.to, inlineMathType.create({ latex }))
    },
  })
}

function createBlockMathPasteRule() {
  return new PasteRule({
    find: BLOCK_MATH_PASTE_REGEX,
    handler: ({ state, range, match }) => {
      const blockMathType = getBlockMathType(state.schema)

      if (!blockMathType || isInsideCodeContext(state, range.from)) {
        return
      }

      const latex = sanitizeLatex(match[1] ?? "")

      if (!latex) {
        return
      }

      state.tr.replaceWith(range.from, range.to, blockMathType.create({ latex }))
    },
  })
}

function createMultilineBlockMathPlugin() {
  const getChildStart = (parentStart: number, parent: ProseMirrorNode, childIndex: number): number => {
    let offset = 0

    for (let index = 0; index < childIndex; index += 1) {
      offset += parent.child(index).nodeSize
    }

    return parentStart + offset
  }

  return new Plugin({
    appendTransaction: (transactions, _oldState, newState) => {
      if (!transactions.some((transaction) => transaction.docChanged)) {
        return null
      }

      const blockMathType = getBlockMathType(newState.schema)

      if (!blockMathType) {
        return null
      }

      const { selection } = newState

      if (!selection.empty || !("$from" in selection)) {
        return null
      }

      const $from = selection.$from

      if (!$from.parent.isTextblock || isInsideCodeContext(newState, selection.from)) {
        return null
      }

      const paragraphText = $from.parent.textContent

      if (!paragraphText.startsWith("$$") || !paragraphText.endsWith("$$")) {
        return null
      }

      const latex = sanitizeLatex(paragraphText.slice(2, -2))

      if (!latex) {
        if ($from.depth < 1) {
          return null
        }

        const parentDepth = $from.depth - 1
        const container = $from.node(parentDepth)
        const currentIndex = $from.index(parentDepth)

        if (!container || currentIndex <= 0 || container.child(currentIndex).textContent.trim() !== "$$") {
          return null
        }

        let openingIndex = -1

        for (let index = currentIndex - 1; index >= 0; index -= 1) {
          const child = container.child(index)

          if (child.isTextblock && child.textContent.trim() === "$$") {
            openingIndex = index
            break
          }
        }

        if (openingIndex < 0 || openingIndex === currentIndex - 1) {
          return null
        }

        const lines: string[] = []

        for (let index = openingIndex + 1; index < currentIndex; index += 1) {
          const child = container.child(index)

          if (!child.isTextblock || child.type.spec.code || isMathNodeName(child.type.name)) {
            return null
          }

          lines.push(child.textContent)
        }

        const multilineLatex = sanitizeLatex(lines.join("\n"))

        if (!multilineLatex) {
          return null
        }

        const containerStart = $from.start(parentDepth)
        const replaceFrom = getChildStart(containerStart, container, openingIndex)
        const replaceTo = getChildStart(containerStart, container, currentIndex) + container.child(currentIndex).nodeSize

        return newState.tr.replaceWith(replaceFrom, replaceTo, blockMathType.create({ latex: multilineLatex }))
      }

      const start = selection.from - $from.parentOffset
      const end = start + $from.parent.nodeSize - 2

      return newState.tr.replaceWith(start, end, blockMathType.create({ latex }))
    },
  })
}

export const MarkdownMathInputExtension = Extension.create({
  name: "markdownMathInputExtension",

  addInputRules() {
    return [createBlockMathInputRule(), createInlineMathInputRule()]
  },

  addPasteRules() {
    return [createBlockMathPasteRule(), createInlineMathPasteRule()]
  },

  addProseMirrorPlugins() {
    return [createMultilineBlockMathPlugin()]
  },
})
