"use client";

let mermaidInitialized = false;

async function getMermaid() {
  const mermaidModule = await import("mermaid");
  const mermaid = mermaidModule.default;

  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
      suppressErrorRendering: true,
    });

    mermaidInitialized = true;
  }

  return mermaid;
}

export function findMermaidCodeBlocks(root: ParentNode): HTMLPreElement[] {
  return Array.from(root.querySelectorAll<HTMLPreElement>("pre")).filter((pre) =>
    Boolean(pre.querySelector("code.language-mermaid")),
  );
}

export async function renderMermaidSource(
  host: HTMLElement,
  source: string,
  diagramId: string,
): Promise<void> {
  const mermaid = await getMermaid();

  try {
    const { svg, bindFunctions } = await mermaid.render(diagramId, source);
    host.innerHTML = svg;
    bindFunctions?.(host);
    host.dataset.invalid = "false";
  } catch {
    host.innerHTML = "";
    host.dataset.invalid = "true";
    host.textContent = "Unable to render Mermaid diagram. Check the diagram syntax.";
  }
}

export async function enhanceMermaidCodeBlocks(root: HTMLElement, isActive: () => boolean): Promise<void> {
  const mermaidBlocks = findMermaidCodeBlocks(root);

  for (const [index, pre] of mermaidBlocks.entries()) {
    if (!isActive()) {
      return;
    }

    const code = pre.querySelector("code.language-mermaid");
    const source = code?.textContent?.trim() ?? "";

    if (!source) {
      continue;
    }

    const host = document.createElement("div");
    host.className = "synapse-mermaid-render";

    pre.replaceWith(host);

    await renderMermaidSource(host, source, `mermaid-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`);
  }
}

export async function renderMermaidInHtmlString(html: string): Promise<string> {
  const container = document.createElement("div");
  container.innerHTML = html;

  const mermaidCodeBlocks = Array.from(container.querySelectorAll<HTMLPreElement>("pre")).filter((pre) => {
    const code = pre.querySelector("code");
    const className = code?.className ?? "";
    return /\blanguage-mermaid\b/i.test(className);
  });

  for (const [index, pre] of mermaidCodeBlocks.entries()) {
    const code = pre.querySelector("code");
    const source = code?.textContent?.trim() ?? "";

    if (!source) {
      continue;
    }

    const host = document.createElement("div");
    host.className = "synapse-mermaid-render";
    pre.replaceWith(host);

    await renderMermaidSource(host, source, `print-mermaid-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`);
  }

  return container.innerHTML;
}
