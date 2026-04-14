import { Extension, InputRule, PasteRule } from "@tiptap/core"

const INLINE_MATH_REGEX = /(?<!\$)\$([^\n$]+?)\$(?!\$)$/
const INLINE_MATH_REGEX_GLOBAL = /(?<!\$)\$([^\n$]+?)\$(?!\$)/g
const BLOCK_MATH_REGEX = /^\$\$([^$]+?)\$\$$/
const BLOCK_MATH_REGEX_GLOBAL = /^\$\$([^$]+?)\$\$$/g

/**
 * Restores markdown-like math typing:
 * - `$...$` => inline math node
 * - `$$...$$` on its own line => block math node
 */
export const MarkdownMathInputExtension = Extension.create({
  name: "markdownMathInputExtension",

  addInputRules() {
    return [
      new InputRule({
        find: BLOCK_MATH_REGEX,
        handler: ({ state, range, match }) => {
          const latex = match[1]?.trim()

          if (!latex) {
            return
          }

          const blockMathType = state.schema.nodes.blockMath

          if (!blockMathType) {
            return
          }

          state.tr.replaceWith(
            range.from,
            range.to,
            blockMathType.create({ latex })
          )
        },
      }),
      new InputRule({
        find: INLINE_MATH_REGEX,
        handler: ({ state, range, match }) => {
          const latex = match[1]?.trim()

          if (!latex) {
            return
          }

          const inlineMathType = state.schema.nodes.inlineMath

          if (!inlineMathType) {
            return
          }

          state.tr.replaceWith(
            range.from,
            range.to,
            inlineMathType.create({ latex })
          )
        },
      }),
    ]
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: BLOCK_MATH_REGEX_GLOBAL,
        handler: ({ state, range, match }) => {
          const latex = match[1]?.trim()

          if (!latex) {
            return
          }

          const blockMathType = state.schema.nodes.blockMath

          if (!blockMathType) {
            return
          }

          state.tr.replaceWith(
            range.from,
            range.to,
            blockMathType.create({ latex })
          )
        },
      }),
      new PasteRule({
        find: INLINE_MATH_REGEX_GLOBAL,
        handler: ({ state, range, match }) => {
          const latex = match[1]?.trim()

          if (!latex) {
            return
          }

          const inlineMathType = state.schema.nodes.inlineMath

          if (!inlineMathType) {
            return
          }

          state.tr.replaceWith(
            range.from,
            range.to,
            inlineMathType.create({ latex })
          )
        },
      }),
    ]
  },
})
