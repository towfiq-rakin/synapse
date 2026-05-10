import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { PublicWorkspaceFolder, PublicWorkspaceNote } from "@/lib/publishing/public-queries";
import { cn } from "@/lib/utils";

type PublicNoteExplorerProps = {
  roots: PublicWorkspaceFolder[];
  unfiledNotes: PublicWorkspaceNote[];
  activeHref?: string | null;
};

function NoteItem({
  note,
  activeHref,
}: {
  note: PublicWorkspaceNote;
  activeHref?: string | null;
}) {
  const isActive = activeHref === note.href;

  return (
    <li>
      <Link
        href={note.href}
        className={cn(
          "block rounded-md px-2 py-1 text-[0.98rem] leading-6 transition-colors [font-family:var(--font-theme-lora)]",
          "text-muted-foreground hover:text-foreground",
          isActive && "font-semibold text-foreground",
        )}
      >
        <span className="block min-w-0 truncate">{note.title}</span>
      </Link>
    </li>
  );
}

function FolderBranch({
  node,
  activeHref,
}: {
  node: PublicWorkspaceFolder;
  activeHref?: string | null;
}) {
  const hasChildren = node.children.length > 0 || node.notes.length > 0;

  return (
    <li>
      <details open={hasChildren} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1 text-[1rem] font-medium leading-6 text-foreground/85 transition-colors hover:text-foreground [font-family:var(--font-theme-lora)]">
          <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-open:hidden" />
          <ChevronDown className="hidden size-3.5 text-muted-foreground group-open:block" />
          <span className="truncate">{node.name}</span>
        </summary>

        <div className="ml-3 border-l border-border/60 pl-3">
          {node.notes.length > 0 ? (
            <ul className="space-y-0.5 py-1">
              {node.notes.map((note) => (
                <NoteItem key={note.id} note={note} activeHref={activeHref} />
              ))}
            </ul>
          ) : null}

          {node.children.length > 0 ? (
            <ul className="space-y-0.5 py-1">
              {node.children.map((child) => (
                <FolderBranch key={child.id} node={child} activeHref={activeHref} />
              ))}
            </ul>
          ) : null}
        </div>
      </details>
    </li>
  );
}

export default function PublicNoteExplorer({
  roots,
  unfiledNotes,
  activeHref,
}: PublicNoteExplorerProps) {
  const isEmpty = roots.length === 0 && unfiledNotes.length === 0;

  return (
    <section className="text-card-foreground">
      <div className="pb-3">
        <div className="flex items-center gap-2 text-[1.65rem] font-semibold leading-none [font-family:var(--font-theme-lora)]">
          <span>Explorer</span>
        </div>
      </div>

      {isEmpty ? (
        <div className="py-5 text-sm text-muted-foreground">No published notes yet.</div>
      ) : (
        <div className="space-y-2.5">
          {unfiledNotes.length > 0 ? (
            <div>
              <ul className="space-y-0.5">
                {unfiledNotes.map((note) => (
                  <NoteItem key={note.id} note={note} activeHref={activeHref} />
                ))}
              </ul>
            </div>
          ) : null}

          {roots.length > 0 ? (
            <ul className="space-y-0.5">
              {roots.map((root) => (
                <FolderBranch key={root.id} node={root} activeHref={activeHref} />
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}
