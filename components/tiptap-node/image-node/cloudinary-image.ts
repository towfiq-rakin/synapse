import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeTextAttribute(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeDimensionAttribute(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }

  return null;
}

export const CloudinaryImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      publicId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-public-id"),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.publicId ? { "data-public-id": attributes.publicId } : {},
      },
      assetId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-asset-id"),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.assetId ? { "data-asset-id": attributes.assetId } : {},
      },
      provider: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-provider"),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.provider ? { "data-provider": attributes.provider } : {},
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  renderMarkdown(node: { attrs?: Record<string, unknown> }) {
    const src = normalizeTextAttribute(node.attrs?.src) ?? "";
    const alt = normalizeTextAttribute(node.attrs?.alt) ?? "";
    const title = normalizeTextAttribute(node.attrs?.title);
    const publicId = normalizeTextAttribute(node.attrs?.publicId);
    const assetId = normalizeTextAttribute(node.attrs?.assetId);
    const provider = normalizeTextAttribute(node.attrs?.provider);
    const width = normalizeDimensionAttribute(node.attrs?.width);
    const height = normalizeDimensionAttribute(node.attrs?.height);
    const needsHtmlSerialization = Boolean(publicId || assetId || provider || width || height);

    if (!needsHtmlSerialization) {
      return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
    }

    const attributes = [`src="${escapeHtmlAttribute(src)}"`];

    if (alt) {
      attributes.push(`alt="${escapeHtmlAttribute(alt)}"`);
    }

    if (title) {
      attributes.push(`title="${escapeHtmlAttribute(title)}"`);
    }

    if (width) {
      attributes.push(`width="${width}"`);
    }

    if (height) {
      attributes.push(`height="${height}"`);
    }

    if (provider) {
      attributes.push(`data-provider="${escapeHtmlAttribute(provider)}"`);
    }

    if (publicId) {
      attributes.push(`data-public-id="${escapeHtmlAttribute(publicId)}"`);
    }

    if (assetId) {
      attributes.push(`data-asset-id="${escapeHtmlAttribute(assetId)}"`);
    }

    return `<img ${attributes.join(" ")} />`;
  },
});

export default CloudinaryImage;
