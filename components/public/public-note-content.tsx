"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type PublicNoteContentProps = {
  html: string;
};

function buildCopyButton(onClick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "public-code-copy-button";
  button.setAttribute("aria-label", "Copy code");
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" class="public-code-copy-icon">
      <rect x="9" y="9" width="13" height="13" rx="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
  button.addEventListener("click", onClick);
  return button;
}

function setCopyButtonCopiedState(button: HTMLButtonElement) {
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" class="public-code-copy-icon">
      <path d="M20 6 9 17l-5-5"></path>
    </svg>
  `;
}

function setCopyButtonDefaultState(button: HTMLButtonElement) {
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" class="public-code-copy-icon">
      <rect x="9" y="9" width="13" height="13" rx="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
}

export default function PublicNoteContent({ html }: PublicNoteContentProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = contentRef.current;

    if (!root) {
      return;
    }

    const cleanups: Array<() => void> = [];

    for (const pre of root.querySelectorAll("pre")) {
      if (pre.dataset.copyReady === "true") {
        continue;
      }

      const code = pre.querySelector("code");
      const codeText = code?.textContent?.trimEnd() ?? pre.textContent?.trimEnd() ?? "";

      if (!codeText) {
        continue;
      }

      pre.dataset.copyReady = "true";

      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(codeText);
          setCopyButtonCopiedState(button);
          toast.success("Code copied.");
          window.setTimeout(() => {
            setCopyButtonDefaultState(button);
          }, 1600);
        } catch {
          toast.error("Could not copy code.");
        }
      };

      const button = buildCopyButton(() => {
        void handleCopy();
      });
      pre.appendChild(button);

      cleanups.push(() => {
        button.remove();
        delete pre.dataset.copyReady;
      });
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [html]);

  return <div ref={contentRef} className="mt-9 public-docs-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
