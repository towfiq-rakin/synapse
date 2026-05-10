import { Extension, type NodeViewRendererProps } from "@tiptap/core"
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics"
import type { KatexOptions } from "katex"
import katex from "katex"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { NodeSelection, TextSelection } from "@tiptap/pm/state"

function renderKatex(target: HTMLElement, latex: string, options?: KatexOptions): boolean {
  try {
    katex.render(latex, target, {
      throwOnError: false,
      output: "html",
      ...options,
    })

    return true
  } catch {
    target.textContent = latex
    return false
  }
}

function getNodePos(getPos: NodeViewRendererProps["getPos"]): number | null {
  const resolved = getPos()
  return typeof resolved === "number" ? resolved : null
}

const EditableInlineMath = InlineMath.extend({
  addNodeView() {
    const { katexOptions } = this.options

    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement("span")
      wrapper.className = "synapse-math synapse-math--inline"
      wrapper.dataset.type = "inline-math"

      const render = document.createElement("span")
      render.className = "synapse-math-render"

      const source = document.createElement("span")
      source.className = "synapse-math-source"

      const leftDelimiter = document.createElement("span")
      leftDelimiter.className = "synapse-math-delimiter"
      leftDelimiter.textContent = "$"

      const rightDelimiter = document.createElement("span")
      rightDelimiter.className = "synapse-math-delimiter"
      rightDelimiter.textContent = "$"

      const input = document.createElement("input")
      input.className = "synapse-math-input"
      input.type = "text"
      input.spellcheck = false
      input.autocomplete = "off"

      source.append(leftDelimiter, input, rightDelimiter)
      wrapper.append(render, source)

      let currentNode: ProseMirrorNode = node
      let editing = false
      let draft = currentNode.attrs.latex ?? ""
      let initial = draft

      const syncFromNode = () => {
        draft = currentNode.attrs.latex ?? ""
        initial = draft
        input.value = draft
      }

      const redraw = () => {
        const ok = renderKatex(render, currentNode.attrs.latex ?? "", katexOptions)
        wrapper.dataset.invalid = ok ? "false" : "true"
      }

      const startEditing = () => {
        if (editing) {
          return
        }

        editing = true
        wrapper.dataset.editing = "true"
        syncFromNode()
        requestAnimationFrame(() => {
          input.focus()
          input.setSelectionRange(input.value.length, input.value.length)
        })
      }

      const commit = () => {
        if (!editing) {
          return
        }

        editing = false
        wrapper.dataset.editing = "false"
        const nextLatex = input.value.trim()

        const pos = getNodePos(getPos)
        if (pos == null) {
          return
        }

        if (!nextLatex) {
          editor.view.dispatch(editor.state.tr.delete(pos, pos + currentNode.nodeSize))
          editor.commands.focus(pos)
          return
        }

        if (nextLatex !== currentNode.attrs.latex) {
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(pos, undefined, {
              ...currentNode.attrs,
              latex: nextLatex,
            }),
          )
        }

        editor.commands.focus(pos + currentNode.nodeSize)
      }

      const cancel = () => {
        editing = false
        wrapper.dataset.editing = "false"
        input.value = initial
        editor.commands.focus()
      }

      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          commit()
          return
        }

        if (event.key === "Escape") {
          event.preventDefault()
          cancel()
          return
        }

        if (event.key === "Backspace" && input.value.length === 0) {
          event.preventDefault()
          commit()
        }
      })

      input.addEventListener("blur", () => {
        commit()
      })

      wrapper.addEventListener("mousedown", (event) => {
        const pos = getNodePos(getPos)
        if (pos == null) {
          return
        }

        event.preventDefault()
        editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)))
        startEditing()
      })

      syncFromNode()
      redraw()
      wrapper.dataset.editing = "false"

      return {
        dom: wrapper,
        update: (updatedNode: ProseMirrorNode) => {
          if (updatedNode.type !== currentNode.type) {
            return false
          }

          currentNode = updatedNode

          if (!editing) {
            syncFromNode()
          }

          redraw()
          return true
        },
        selectNode: () => {
          wrapper.dataset.selected = "true"
          startEditing()
        },
        deselectNode: () => {
          wrapper.dataset.selected = "false"
          if (editing) {
            commit()
          }
        },
        stopEvent: (event) => {
          if (!(event.target instanceof HTMLElement)) {
            return false
          }

          return source.contains(event.target)
        },
        ignoreMutation: () => true,
      }
    }
  },
})

const EditableBlockMath = BlockMath.extend({
  addNodeView() {
    const { katexOptions } = this.options

    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement("div")
      wrapper.className = "synapse-math synapse-math--block"
      wrapper.dataset.type = "block-math"

      const render = document.createElement("div")
      render.className = "synapse-math-render"

      const source = document.createElement("div")
      source.className = "synapse-math-source"

      const topDelimiter = document.createElement("div")
      topDelimiter.className = "synapse-math-delimiter"
      topDelimiter.textContent = "$$"

      const bottomDelimiter = document.createElement("div")
      bottomDelimiter.className = "synapse-math-delimiter"
      bottomDelimiter.textContent = "$$"

      const textarea = document.createElement("textarea")
      textarea.className = "synapse-math-textarea"
      textarea.rows = 3
      textarea.spellcheck = false

      source.append(topDelimiter, textarea, bottomDelimiter)
      wrapper.append(render, source)

      let currentNode: ProseMirrorNode = node
      let editing = false
      let initial = currentNode.attrs.latex ?? ""

      const syncFromNode = () => {
        initial = currentNode.attrs.latex ?? ""
        textarea.value = initial
      }

      const redraw = () => {
        const ok = renderKatex(render, currentNode.attrs.latex ?? "", {
          displayMode: true,
          ...katexOptions,
        })
        wrapper.dataset.invalid = ok ? "false" : "true"
      }

      const startEditing = () => {
        if (editing) {
          return
        }

        editing = true
        wrapper.dataset.editing = "true"
        syncFromNode()
        requestAnimationFrame(() => {
          textarea.focus()
          textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        })
      }

      const commit = () => {
        if (!editing) {
          return
        }

        editing = false
        wrapper.dataset.editing = "false"
        const nextLatex = textarea.value.trim()

        const pos = getNodePos(getPos)
        if (pos == null) {
          return
        }

        if (!nextLatex) {
          editor.view.dispatch(editor.state.tr.delete(pos, pos + currentNode.nodeSize))
          editor.commands.focus(pos)
          return
        }

        if (nextLatex !== currentNode.attrs.latex) {
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(pos, undefined, {
              ...currentNode.attrs,
              latex: nextLatex,
            }),
          )
        }

        const selectionPos = Math.min(pos + currentNode.nodeSize + 1, editor.state.doc.content.size)
        editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, selectionPos)))
        editor.commands.focus(selectionPos)
      }

      const cancel = () => {
        editing = false
        wrapper.dataset.editing = "false"
        textarea.value = initial
        editor.commands.focus()
      }

      textarea.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          cancel()
          return
        }

        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          commit()
          return
        }

        if (event.key === "Backspace" && textarea.value.length === 0) {
          event.preventDefault()
          commit()
        }
      })

      textarea.addEventListener("blur", () => {
        commit()
      })

      wrapper.addEventListener("mousedown", (event) => {
        const pos = getNodePos(getPos)
        if (pos == null) {
          return
        }

        event.preventDefault()
        editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)))
        startEditing()
      })

      syncFromNode()
      redraw()
      wrapper.dataset.editing = "false"

      return {
        dom: wrapper,
        update: (updatedNode: ProseMirrorNode) => {
          if (updatedNode.type !== currentNode.type) {
            return false
          }

          currentNode = updatedNode

          if (!editing) {
            syncFromNode()
          }

          redraw()
          return true
        },
        selectNode: () => {
          wrapper.dataset.selected = "true"
          startEditing()
        },
        deselectNode: () => {
          wrapper.dataset.selected = "false"
          if (editing) {
            commit()
          }
        },
        stopEvent: (event) => {
          if (!(event.target instanceof HTMLElement)) {
            return false
          }

          return source.contains(event.target)
        },
        ignoreMutation: () => true,
      }
    }
  },
})

export const EditableMathematics = Extension.create<{
  katexOptions?: KatexOptions
}>({
  name: "editableMathematics",

  addOptions() {
    return {
      katexOptions: undefined,
    }
  },

  addExtensions() {
    return [
      EditableBlockMath.configure({
        katexOptions: this.options.katexOptions,
      }),
      EditableInlineMath.configure({
        katexOptions: this.options.katexOptions,
      }),
    ]
  },
})
