"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder as FolderIcon,
  FolderPlus,
  Pencil,
  SquarePen,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type SortMode = "name-asc" | "name-desc" | "updated-desc"

type ExplorerFolder = {
  id: string
  name: string
  slug: string
  parentId: string | null
  order: number
  path: string[]
  href: string
  updatedAt: string
}

type ExplorerNote = {
  id: string
  title: string
  slug: string
  folderId: string | null
  path: string[]
  href: string
  updatedAt: string
}

type ExplorerPayload = {
  user: {
    id: string
    username: string
    name: string
  }
  folders: ExplorerFolder[]
  notes: ExplorerNote[]
}

type ExplorerSidebarProps = {
  open: boolean
}

type TreeFolder = ExplorerFolder & {
  children: TreeFolder[]
  notes: ExplorerNote[]
}

type FolderOption = {
  id: string
  label: string
}

function ToolButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          onClick={onClick}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

function compareBySort(sortMode: SortMode) {
  return (a: { name?: string; title?: string; updatedAt: string }, b: { name?: string; title?: string; updatedAt: string }) => {
    if (sortMode === "updated-desc") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }

    const aLabel = (a.name ?? a.title ?? "").toLowerCase()
    const bLabel = (b.name ?? b.title ?? "").toLowerCase()
    const result = aLabel.localeCompare(bLabel)

    return sortMode === "name-desc" ? -result : result
  }
}

function buildTree(payload: ExplorerPayload | null, sortMode: SortMode) {
  const roots: TreeFolder[] = []
  const unfiledNotes: ExplorerNote[] = []
  const foldersById = new Map<string, TreeFolder>()
  const compare = compareBySort(sortMode)

  for (const folder of payload?.folders ?? []) {
    foldersById.set(folder.id, {
      ...folder,
      children: [],
      notes: [],
    })
  }

  for (const folder of foldersById.values()) {
    const parent = folder.parentId ? foldersById.get(folder.parentId) : undefined

    if (parent) {
      parent.children.push(folder)
    } else {
      roots.push(folder)
    }
  }

  for (const note of payload?.notes ?? []) {
    const folder = note.folderId ? foldersById.get(note.folderId) : undefined

    if (folder) {
      folder.notes.push(note)
    } else {
      unfiledNotes.push(note)
    }
  }

  function sortFolder(folder: TreeFolder) {
    folder.children.sort(compare)
    folder.notes.sort(compare)

    for (const child of folder.children) {
      sortFolder(child)
    }
  }

  roots.sort(compare)
  unfiledNotes.sort(compare)

  for (const root of roots) {
    sortFolder(root)
  }

  return { roots, unfiledNotes }
}

function flattenFolderOptions(folders: TreeFolder[], depth = 0): FolderOption[] {
  return folders.flatMap((folder) => [
    { id: folder.id, label: `${"  ".repeat(depth)}${folder.name}` },
    ...flattenFolderOptions(folder.children, depth + 1),
  ])
}

function NoteLink({ note, depth }: { note: ExplorerNote; depth: number }) {
  const pathname = usePathname()
  const active = pathname === note.href

  return (
    <Link
      href={note.href}
      className={cn(
        "flex h-7 min-w-0 items-center gap-2 rounded-sm pr-2 text-[13px] leading-none text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
      style={{ paddingLeft: `${depth * 16 + 10}px` }}
    >
      <span className="min-w-0 truncate">{note.title}</span>
      {active ? (
        <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
          Canvas
        </span>
      ) : null}
    </Link>
  )
}

function FolderBranch({
  folder,
  depth,
  openFolders,
  onToggle,
  onCreateNoteInFolder,
  onCreateFolderInFolder,
  onRenameFolder,
  onDeleteFolder,
  onRenameNote,
  onDeleteNote,
}: {
  folder: TreeFolder
  depth: number
  openFolders: Set<string>
  onToggle: (id: string) => void
  onCreateNoteInFolder: (folderId: string) => void
  onCreateFolderInFolder: (folderId: string) => void
  onRenameFolder: (folder: ExplorerFolder) => void
  onDeleteFolder: (folder: ExplorerFolder) => void
  onRenameNote: (note: ExplorerNote) => void
  onDeleteNote: (note: ExplorerNote) => void
}) {
  const open = openFolders.has(folder.id)

  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            onClick={() => onToggle(folder.id)}
            className="flex h-7 w-full min-w-0 items-center gap-1 rounded-sm pr-2 text-left text-[13px] leading-none text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            style={{ paddingLeft: `${depth * 16 + 6}px` }}
          >
            {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            <FolderIcon className="size-3.5 text-sidebar-foreground/55" />
            <span className="min-w-0 truncate">{folder.name}</span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => onCreateNoteInFolder(folder.id)}>
            <SquarePen className="size-4" />
            New Note
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => onCreateFolderInFolder(folder.id)}>
            <FolderPlus className="size-4" />
            New Folder
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => onRenameFolder(folder)}>
            <Pencil className="size-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem variant="destructive" onSelect={() => onDeleteFolder(folder)}>
            <Trash2 className="size-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {open ? (
        <ul className="relative ml-5 border-l border-sidebar-border/80">
          {folder.children.map((child) => (
            <FolderBranch
              key={child.id}
              folder={child}
              depth={depth + 1}
              openFolders={openFolders}
              onToggle={onToggle}
              onCreateNoteInFolder={onCreateNoteInFolder}
              onCreateFolderInFolder={onCreateFolderInFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onRenameNote={onRenameNote}
              onDeleteNote={onDeleteNote}
            />
          ))}
          {folder.notes.map((note) => (
            <li key={note.id}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div>
                    <NoteLink note={note} depth={depth + 1} />
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => onRenameNote(note)}>
                    <Pencil className="size-4" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem variant="destructive" onSelect={() => onDeleteNote(note)}>
                    <Trash2 className="size-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export default function ExplorerSidebar({ open }: ExplorerSidebarProps) {
  const router = useRouter()
  const [payload, setPayload] = useState<ExplorerPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>("name-asc")
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
  const [newNoteOpen, setNewNoteOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [renameFolderOpen, setRenameFolderOpen] = useState(false)
  const [renameNoteOpen, setRenameNoteOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState("")
  const [renameTargetFolder, setRenameTargetFolder] = useState<ExplorerFolder | null>(null)
  const [renameTargetNote, setRenameTargetNote] = useState<ExplorerNote | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const tree = useMemo(() => buildTree(payload, sortMode), [payload, sortMode])
  const folderOptions = useMemo(() => flattenFolderOptions(tree.roots), [tree.roots])
  const allFolderIds = useMemo(() => payload?.folders.map((folder) => folder.id) ?? [], [payload])

  async function refreshExplorer() {
    setLoading(true)
    try {
      const response = await fetch("/api/explorer", { cache: "no-store" })
      if (!response.ok) return

      const data = (await response.json()) as { explorer: ExplorerPayload }
      setPayload(data.explorer)
      setOpenFolders((current) => {
        if (current.size > 0) return current
        return new Set(data.explorer.folders.map((folder) => folder.id))
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && !payload && !loading) {
      void refreshExplorer()
    }
  }, [loading, open, payload])

  function toggleFolder(folderId: string) {
    setOpenFolders((current) => {
      const next = new Set(current)

      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }

      return next
    })
  }

  function setAllFolders(nextOpen: boolean) {
    setOpenFolders(nextOpen ? new Set(allFolderIds) : new Set())
  }

  async function createNote(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim() || "Untitled"
    const folderId = String(formData.get("folderId") ?? "")

    setSubmitting(true)
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          folderId: folderId || null,
          content: "",
          contentText: "",
        }),
      })

      if (!response.ok) return

      const data = (await response.json()) as { href?: string; explorer?: ExplorerPayload }
      if (data.explorer) setPayload(data.explorer)
      setNewNoteOpen(false)
      router.push(data.href ?? "/notes")
    } finally {
      setSubmitting(false)
    }
  }

  async function createFolder(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim()
    const parentId = String(formData.get("parentId") ?? "")

    if (!name) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          parentId: parentId || null,
        }),
      })

      if (!response.ok) return

      const data = (await response.json()) as { explorer?: ExplorerPayload }
      if (data.explorer) {
        setPayload(data.explorer)
        setOpenFolders(new Set(data.explorer.folders.map((folder) => folder.id)))
      }
      setNewFolderOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  function openNewNoteInFolder(folderId: string) {
    setSelectedParentId(folderId)
    setNewNoteOpen(true)
  }

  function openNewFolderInFolder(folderId: string) {
    setSelectedParentId(folderId)
    setNewFolderOpen(true)
  }

  async function renameFolder(formData: FormData) {
    if (!renameTargetFolder) return
    const name = String(formData.get("name") ?? "").trim()
    if (!name) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/folders/${renameTargetFolder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) return

      const data = (await response.json()) as { explorer?: ExplorerPayload }
      if (data.explorer) setPayload(data.explorer)
      setRenameFolderOpen(false)
      setRenameTargetFolder(null)
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteFolder(folder: ExplorerFolder) {
    if (!window.confirm(`Delete folder "${folder.name}" and all nested notes/folders?`)) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" })
      if (!response.ok) return

      const data = (await response.json()) as { explorer?: ExplorerPayload }
      if (data.explorer) setPayload(data.explorer)
    } finally {
      setSubmitting(false)
    }
  }

  async function renameNote(formData: FormData) {
    if (!renameTargetNote) return
    const title = String(formData.get("title") ?? "").trim()
    if (!title) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/notes/${renameTargetNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (!response.ok) return

      const data = (await response.json()) as { explorer?: ExplorerPayload; href?: string }
      if (data.explorer) setPayload(data.explorer)
      setRenameNoteOpen(false)
      setRenameTargetNote(null)
      if (data.href && window.location.pathname.includes(renameTargetNote.slug)) {
        router.replace(data.href)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteNote(note: ExplorerNote) {
    if (!window.confirm(`Delete note "${note.title}"?`)) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/notes/${note.id}`, { method: "DELETE" })
      if (!response.ok) return
      const shouldMove = window.location.pathname === note.href
      await refreshExplorer()
      if (shouldMove) {
        router.push("/notes")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <aside
        data-state={open ? "open" : "closed"}
        className={cn(
          "fixed inset-y-0 left-(--sidebar-width-icon) z-30 hidden w-56 flex-col border-x border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm md:flex",
          "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-3 opacity-0"
        )}
      >
        <div className="flex h-11 items-center gap-1 border-b border-sidebar-border px-2">
          <ToolButton label="New Note" onClick={() => setNewNoteOpen(true)}>
            <SquarePen className="size-4" />
          </ToolButton>
          <ToolButton label="New Folder" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="size-4" />
          </ToolButton>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Change Sort Order"
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  >
                    <ArrowUpDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Change Sort Order</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuRadioGroup
                value={sortMode}
                onValueChange={(value) => setSortMode(value as SortMode)}
              >
                <DropdownMenuRadioItem value="name-asc">
                  <ArrowDownAZ className="size-4" />
                  Name A-Z
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name-desc">
                  <ArrowUpAZ className="size-4" />
                  Name Z-A
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="updated-desc">
                  <FileText className="size-4" />
                  Recently Updated
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolButton
            label={openFolders.size === allFolderIds.length ? "Collapse All" : "Expand All"}
            onClick={() => setAllFolders(openFolders.size !== allFolderIds.length)}
          >
            {openFolders.size === allFolderIds.length ? (
              <ChevronsDownUp className="size-4" />
            ) : (
              <ChevronsUpDown className="size-4" />
            )}
          </ToolButton>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-auto px-2 py-2">
          {loading && !payload ? (
            <div className="px-2 py-3 text-xs text-sidebar-foreground/55">Loading...</div>
          ) : null}

          {!loading && payload && payload.folders.length === 0 && payload.notes.length === 0 ? (
            <div className="px-2 py-3 text-xs text-sidebar-foreground/55">No notes yet.</div>
          ) : null}

          <nav aria-label="Explorer">
            <ul className="space-y-0.5">
              {tree.roots.map((folder) => (
                <FolderBranch
                  key={folder.id}
                  folder={folder}
                  depth={0}
                  openFolders={openFolders}
                  onToggle={toggleFolder}
                  onCreateNoteInFolder={openNewNoteInFolder}
                  onCreateFolderInFolder={openNewFolderInFolder}
                  onRenameFolder={(currentFolder) => {
                    setRenameTargetFolder(currentFolder)
                    setRenameFolderOpen(true)
                  }}
                  onDeleteFolder={deleteFolder}
                  onRenameNote={(currentNote) => {
                    setRenameTargetNote(currentNote)
                    setRenameNoteOpen(true)
                  }}
                  onDeleteNote={deleteNote}
                />
              ))}

              {tree.unfiledNotes.map((note) => (
                <li key={note.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div>
                        <NoteLink note={note} depth={0} />
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onSelect={() => {
                          setRenameTargetNote(note)
                          setRenameNoteOpen(true)
                        }}
                      >
                        <Pencil className="size-4" />
                        Rename
                      </ContextMenuItem>
                      <ContextMenuItem variant="destructive" onSelect={() => deleteNote(note)}>
                        <Trash2 className="size-4" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      <Dialog open={newNoteOpen} onOpenChange={setNewNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Note</DialogTitle>
          </DialogHeader>
          <form action={createNote} className="grid gap-3">
            <Input name="title" placeholder="Note name" autoComplete="off" />
            <select
              name="folderId"
              value={selectedParentId}
              onChange={(event) => setSelectedParentId(event.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">Root</option>
              {folderOptions.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.label}
                </option>
              ))}
            </select>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <form action={createFolder} className="grid gap-3">
            <Input name="name" placeholder="Folder name" autoComplete="off" required />
            <select
              name="parentId"
              value={selectedParentId}
              onChange={(event) => setSelectedParentId(event.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">Root</option>
              {folderOptions.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.label}
                </option>
              ))}
            </select>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renameFolderOpen} onOpenChange={setRenameFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <form action={renameFolder} className="grid gap-3">
            <Input
              name="name"
              placeholder="Folder name"
              autoComplete="off"
              required
              defaultValue={renameTargetFolder?.name ?? ""}
            />
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renameNoteOpen} onOpenChange={setRenameNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Note</DialogTitle>
          </DialogHeader>
          <form action={renameNote} className="grid gap-3">
            <Input
              name="title"
              placeholder="Note name"
              autoComplete="off"
              required
              defaultValue={renameTargetNote?.title ?? ""}
            />
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
