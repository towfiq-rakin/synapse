"use client";

import Link from "next/link";
import { useRef } from "react";
import { FileText, Folder as FolderIcon, FolderTree, Plus } from "lucide-react";
import { createFolderAction, createQuickNoteAction } from "@/app/(app)/notes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  buildFolderSegmentsById,
  buildPrivateNoteHref,
  type FolderPathNode,
  type NotePathNode,
  toId,
  toNullableId,
} from "@/lib/notes-path";
import { cn } from "@/lib/utils";

type SidebarNote = NotePathNode;

type SidebarFolder = FolderPathNode & {
  name: string;
  order: number;
};

type SidebarTreeProps = {
  folders: SidebarFolder[];
  notes: SidebarNote[];
  className?: string;
};

type FolderNode = {
  id: string;
  name: string;
  slug: string;
  order: number;
  parentId: string | null;
  children: FolderNode[];
  notes: TreeNote[];
};

type TreeNote = {
  id: string;
  title: string;
  slug: string;
  folderId: string | null;
  href: string;
};

type TreeResult = {
  roots: FolderNode[];
  unfiledNotes: TreeNote[];
};

type FolderOption = {
  value: string;
  label: string;
};

function sortFolders(folders: FolderNode[]): FolderNode[] {
  return [...folders].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.name.localeCompare(b.name);
  });
}

function sortNotes(notes: TreeNote[]): TreeNote[] {
  return [...notes].sort((a, b) => a.title.localeCompare(b.title));
}

function buildTree(folders: SidebarFolder[], notes: SidebarNote[]): TreeResult {
  const folderNodes = new Map<string, FolderNode>();

  for (const folder of folders) {
    const id = toId(folder._id);
    const parentId = toNullableId(folder.parentId);

    folderNodes.set(id, {
      id,
      name: folder.name,
      slug: folder.slug,
      order: folder.order,
      parentId,
      children: [],
      notes: [],
    });
  }

  const roots: FolderNode[] = [];

  for (const node of folderNodes.values()) {
    const parent = node.parentId ? folderNodes.get(node.parentId) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const folderSegmentsById = buildFolderSegmentsById(folders);

  const normalizedNotes: TreeNote[] = notes.map((note) => {
    const id = toId(note._id);
    const title = note.title || "Untitled";
    const folderId = toNullableId(note.folderId);
    const slug = note.slug?.trim() || "untitled";

    return {
      id,
      title,
      slug,
      folderId,
      href: buildPrivateNoteHref(note, folderSegmentsById),
    };
  });

  const unfiledNotes: TreeNote[] = [];

  for (const note of normalizedNotes) {
    if (!note.folderId) {
      unfiledNotes.push(note);
      continue;
    }

    const folder = folderNodes.get(note.folderId);
    if (!folder) {
      unfiledNotes.push(note);
      continue;
    }

    folder.notes.push(note);
  }

  function sortNode(node: FolderNode): void {
    node.children = sortFolders(node.children);
    node.notes = sortNotes(node.notes);

    for (const child of node.children) {
      sortNode(child);
    }
  }

  const sortedRoots = sortFolders(roots);
  for (const root of sortedRoots) {
    sortNode(root);
  }

  return {
    roots: sortedRoots,
    unfiledNotes: sortNotes(unfiledNotes),
  };
}

function FolderBranch({ node }: { node: FolderNode }) {
  return (
    <li className="space-y-1">
      <details data-tree-node open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-sm px-2 py-1 text-sm text-foreground hover:bg-muted/40">
          <span className="inline-flex min-w-0 items-center gap-2">
            <FolderIcon className="size-4 text-muted-foreground" />
            <span className="truncate">{node.name}</span>
          </span>

          <form action={createQuickNoteAction}>
            <input type="hidden" name="parentId" value={node.id} />
            <Button type="submit" size="icon-xs" variant="ghost" aria-label={`Create note in ${node.name}`}>
              <Plus className="size-3" />
            </Button>
          </form>
        </summary>

        <ul className="ml-2 mt-1 space-y-1 border-l border-border/70 pl-2">
          {node.notes.map((note) => (
            <li key={note.id}>
              <Link href={note.href} className="block rounded-sm px-2 py-1 text-sm text-foreground hover:bg-muted">
                {note.title}
              </Link>
            </li>
          ))}

          {node.children.map((child) => (
            <FolderBranch key={child.id} node={child} />
          ))}
        </ul>
      </details>
    </li>
  );
}

function flattenFolderOptions(nodes: FolderNode[], depth = 0): FolderOption[] {
  const options: FolderOption[] = [];

  for (const node of nodes) {
    options.push({
      value: node.id,
      label: `${"  ".repeat(depth)}${node.name}`,
    });

    options.push(...flattenFolderOptions(node.children, depth + 1));
  }

  return options;
}

export default function SidebarTree({ folders, notes, className }: SidebarTreeProps) {
  const treeContainerRef = useRef<HTMLDivElement | null>(null);

  const tree = buildTree(folders, notes);
  const folderOptions = flattenFolderOptions(tree.roots);

  function setAllFoldersOpen(open: boolean): void {
    if (!treeContainerRef.current) {
      return;
    }

    const detailsList = treeContainerRef.current.querySelectorAll<HTMLDetailsElement>("details[data-tree-node]");
    for (const detail of detailsList) {
      detail.open = open;
    }
  }

  return (
    <section className={cn("flex h-full min-h-0 flex-col rounded-xl border bg-card text-card-foreground", className)}>
      <div className="border-b px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FolderTree className="size-4 text-muted-foreground" />
          Explorer
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {folders.length} folders, {notes.length} notes
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <form action={createQuickNoteAction}>
            <Button type="submit" size="xs" variant="outline" className="h-7 gap-1 text-xs">
              <Plus className="size-3" />
              New note
            </Button>
          </form>

          <Link href="/" className="text-xs text-muted-foreground hover:underline">
            Open canvas
          </Link>

          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setAllFoldersOpen(false)}
          >
            Collapse all
          </Button>

          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setAllFoldersOpen(true)}
          >
            Expand all
          </Button>
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground">New folder</summary>
          <form action={createFolderAction} className="mt-2 grid gap-2">
            <Input
              name="folderName"
              placeholder="Folder name"
              required
              maxLength={120}
              className="h-8 text-xs"
            />

            <select
              name="parentId"
              defaultValue=""
              className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Root folder</option>
              {folderOptions.map((folder) => (
                <option key={folder.value} value={folder.value}>
                  {folder.label}
                </option>
              ))}
            </select>

            <Button type="submit" size="xs" variant="outline" className="h-7 text-xs">
              Create folder
            </Button>
          </form>
        </details>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav ref={treeContainerRef} className="p-3">
          {tree.roots.length === 0 && tree.unfiledNotes.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              No folders or notes yet. Create your first markdown note.
            </p>
          ) : null}

          <ul className="space-y-2">
            {tree.roots.map((root) => (
              <FolderBranch key={root.id} node={root} />
            ))}

            {tree.unfiledNotes.length > 0 ? (
              <li className="space-y-1 pt-2">
                <div className="flex items-center gap-2 rounded-sm px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <FileText className="size-3.5" />
                  Unfiled notes
                </div>
                <ul className="ml-2 space-y-1 border-l border-border/70 pl-2">
                  {tree.unfiledNotes.map((note) => (
                    <li key={note.id}>
                      <Link href={note.href} className="block rounded-sm px-2 py-1 text-sm text-foreground hover:bg-muted">
                        {note.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ) : null}
          </ul>
        </nav>
      </ScrollArea>
    </section>
  );
}
