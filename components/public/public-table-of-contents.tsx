"use client";

import type { MouseEvent } from "react";
import type { INoteTocItem } from "@/lib/db/models/Note";

type PublicTableOfContentsProps = {
  items: INoteTocItem[];
};

function scrollToHeading(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);

  if (!target) {
    return;
  }

  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

export default function PublicTableOfContents({ items }: PublicTableOfContentsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="border-l border-border/70 pl-4 text-card-foreground">
      <p className="text-[14px] font-extrabold uppercase tracking-[0.24em]">Table of content</p>
      <ul className="mt-3 space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(event) => scrollToHeading(event, item.id)}
              className="block w-full rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground"
              style={{ paddingLeft: `${0.625 + Math.max(0, item.level - 2) * 0.85}rem` }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
