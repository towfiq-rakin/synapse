import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { renderMermaidSource } from "@/lib/mermaid/render-mermaid";

const MermaidPreviewPluginKey = new PluginKey<MermaidPreviewState>("mermaidPreview");

type MermaidPreviewMeta = {
  editingPos: number | null;
};

type MermaidPreviewState = {
  decorations: DecorationSet;
  editingPos: number | null;
};

function isMermaidCodeBlock(node: ProseMirrorNode): boolean {
  return (
    node.type.name === "codeBlock" &&
    typeof node.attrs.language === "string" &&
    node.attrs.language.toLowerCase() === "mermaid"
  );
}

function getMermaidNodeAt(doc: ProseMirrorNode, pos: number | null): { node: ProseMirrorNode; pos: number } | null {
  if (pos == null) {
    return null;
  }

  const node = doc.nodeAt(pos);

  if (!node || !isMermaidCodeBlock(node)) {
    return null;
  }

  return { node, pos };
}

function isSelectionInsideNode(doc: ProseMirrorNode, selectionFrom: number, selectionTo: number, pos: number): boolean {
  const node = doc.nodeAt(pos);

  if (!node) {
    return false;
  }

  const nodeFrom = pos;
  const nodeTo = pos + node.nodeSize;

  return selectionFrom >= nodeFrom && selectionTo <= nodeTo;
}

function createPreviewWidget(source: string, pos: number, view: EditorView): HTMLElement {
  const wrapper = document.createElement("button");
  wrapper.type = "button";
  wrapper.className = "synapse-mermaid-preview";
  wrapper.setAttribute("aria-label", "Edit Mermaid diagram");

  const host = document.createElement("div");
  host.className = "synapse-mermaid-render";
  wrapper.append(host);

  void renderMermaidSource(
    host,
    source,
    `editor-mermaid-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  );

  wrapper.addEventListener("mousedown", (event) => {
    event.preventDefault();

    const node = view.state.doc.nodeAt(pos);

    if (!node) {
      return;
    }

    const nextSelectionPos = Math.min(pos + 1, pos + node.nodeSize - 1);
    const tr = view.state.tr
      .setMeta(MermaidPreviewPluginKey, { editingPos: pos } satisfies MermaidPreviewMeta)
      .setSelection(TextSelection.create(view.state.doc, nextSelectionPos));

    view.dispatch(tr);
    view.focus();
  });

  return wrapper;
}

function buildDecorations(doc: ProseMirrorNode, editingPos: number | null): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!isMermaidCodeBlock(node)) {
      return;
    }

    const source = node.textContent.trim();

    if (!source || editingPos === pos) {
      return;
    }

    decorations.push(
      Decoration.node(pos, pos + node.nodeSize, {
        class: "synapse-mermaid-source-hidden",
      }),
    );

    decorations.push(
      Decoration.widget(pos, (view) => createPreviewWidget(source, pos, view), {
        side: -1,
      }),
    );
  });

  return DecorationSet.create(doc, decorations);
}

export const MermaidPreviewExtension = Extension.create({
  name: "mermaidPreviewExtension",

  addProseMirrorPlugins() {
    return [
      new Plugin<MermaidPreviewState>({
        key: MermaidPreviewPluginKey,
        state: {
          init: (_, state) => ({
            editingPos: null,
            decorations: buildDecorations(state.doc, null),
          }),
          apply: (tr, previous) => {
            const meta = tr.getMeta(MermaidPreviewPluginKey) as MermaidPreviewMeta | undefined;
            let editingPos =
              meta?.editingPos !== undefined ? meta.editingPos : previous.editingPos;

            if (editingPos != null && tr.docChanged) {
              const mapped = tr.mapping.mapResult(editingPos);
              editingPos = mapped.deleted ? null : mapped.pos;
            }

            const activeMermaid = getMermaidNodeAt(tr.doc, editingPos);

            if (
              activeMermaid &&
              !isSelectionInsideNode(tr.doc, tr.selection.from, tr.selection.to, activeMermaid.pos)
            ) {
              editingPos = null;
            }

            return {
              editingPos,
              decorations: buildDecorations(tr.doc, editingPos),
            };
          },
        },
        props: {
          decorations(state) {
            return MermaidPreviewPluginKey.getState(state)?.decorations ?? null;
          },
        },
      }),
    ];
  },
});
