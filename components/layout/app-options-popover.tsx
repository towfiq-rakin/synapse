"use client"

import { useEffect, useRef, useState } from "react"
import {
  BookOpenText,
  Code2,
  Ellipsis,
  FileCode2,
  FileDown,
  FolderInput,
  FolderOpen,
  Loader2,
  PencilLine,
  Replace,
  ScanSearch,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

type FolderItem = {
  id: string
  name: string
  parentId: string | null
}

type AppOptionsPopoverProps = {
  noteId: string
  noteTitle: string
  currentFolderId?: string | null
  exportDisabled?: boolean
  onExportMarkdown?: () => void
  onExportPdf?: () => void
  /** Called after successful rename so parent can update state */
  onRenamed?: (newTitle: string) => void
  /** Called after successful move */
  onMoved?: (newFolderId: string | null) => void
  /** Called after successful delete — parent should navigate away */
  onDeleted?: () => void
  /** Called to open find bar in editor */
  onFind?: () => void
  /** Called to open find+replace bar in editor */
  onReplace?: () => void
}

// ─── Rename Dialog ─────────────────────────────────────────────────────────────

function RenameDialog({
  open,
  currentTitle,
  noteId,
  onOpenChange,
  onRenamed,
}: {
  open: boolean
  currentTitle: string
  noteId: string
  onOpenChange: (open: boolean) => void
  onRenamed?: (newTitle: string) => void
}) {
  const [value, setValue] = useState(currentTitle)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(currentTitle)
      // focus + select-all after mount
      setTimeout(() => {
        inputRef.current?.select()
      }, 50)
    }
  }, [open, currentTitle])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || trimmed === currentTitle) {
      onOpenChange(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        toast.error(data.error ?? "Failed to rename note.")
        return
      }
      onRenamed?.(trimmed)
      toast.success("Note renamed.")
      onOpenChange(false)
    } catch {
      toast.error("Network error. Could not rename note.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename note</DialogTitle>
          <DialogDescription>Enter a new title for this note.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Note title"
            disabled={loading}
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !value.trim()}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Move File To Dialog ────────────────────────────────────────────────────────

function MoveFileDialog({
  open,
  noteId,
  currentFolderId,
  onOpenChange,
  onMoved,
}: {
  open: boolean
  noteId: string
  currentFolderId?: string | null
  onOpenChange: (open: boolean) => void
  onMoved?: (newFolderId: string | null) => void
}) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [moving, setMoving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(currentFolderId ?? null)

  useEffect(() => {
    if (!open) return
    setSelectedId(currentFolderId ?? null)
    setLoading(true)
    fetch("/api/explorer")
      .then((r) => r.json())
      .then((data: { explorer?: { folders?: FolderItem[] } }) => {
        setFolders(data.explorer?.folders ?? [])
      })
      .catch(() => toast.error("Could not load folders."))
      .finally(() => setLoading(false))
  }, [open, currentFolderId])

  async function handleMove() {
    setMoving(true)
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: selectedId }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        toast.error(data.error ?? "Failed to move note.")
        return
      }
      onMoved?.(selectedId)
      toast.success("Note moved.")
      onOpenChange(false)
    } catch {
      toast.error("Network error. Could not move note.")
    } finally {
      setMoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Move file to</DialogTitle>
          <DialogDescription>Select a destination folder.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto rounded-lg border border-border p-1">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading folders…
            </div>
          ) : (
            <>
              {/* Root option */}
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-accent ${selectedId === null ? "bg-accent font-medium" : ""}`}
              >
                <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                Root (no folder)
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedId(folder.id)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-accent ${selectedId === folder.id ? "bg-accent font-medium" : ""}`}
                >
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                  {folder.name}
                </button>
              ))}
              {!loading && folders.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted-foreground">No folders yet.</p>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={moving}
          >
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={moving || loading}>
            {moving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Move here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteAlertDialog({
  open,
  noteId,
  noteTitle,
  onOpenChange,
  onDeleted,
}: {
  open: boolean
  noteId: string
  noteTitle: string
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        toast.error(data.error ?? "Failed to delete note.")
        return
      }
      toast.success("Note deleted.")
      onOpenChange(false)
      onDeleted?.()
    } catch {
      toast.error("Network error. Could not delete note.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete note?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>&ldquo;{noteTitle || "Untitled"}&rdquo;</strong> will be permanently deleted.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              void handleDelete()
            }}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Main Popover ───────────────────────────────────────────────────────────────

export function AppOptionsPopover({
  noteId,
  noteTitle,
  currentFolderId,
  exportDisabled = false,
  onExportMarkdown,
  onExportPdf,
  onRenamed,
  onMoved,
  onDeleted,
  onFind,
  onReplace,
}: AppOptionsPopoverProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function closePopover() {
    setPopoverOpen(false)
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Open note options"
            className="shrink-0"
          >
            <Ellipsis />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={8}
          alignOffset={-4}
          collisionPadding={{ right: 16, top: 8, bottom: 8, left: 8 }}
          className="w-56 p-1.5"
        >
          <div className="space-y-0.5">
            <Button type="button" variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal">
              <BookOpenText className="size-4" />
              Reading view
            </Button>
            <Button type="button" variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal">
              <Code2 className="size-4" />
              Source mode
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
              onClick={() => {
                closePopover()
                setRenameOpen(true)
              }}
            >
              <PencilLine className="size-4" />
              Rename
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
              onClick={() => {
                closePopover()
                setMoveOpen(true)
              }}
            >
              <FolderInput className="size-4" />
              Move file to
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
              disabled={exportDisabled}
              onClick={onExportPdf}
            >
              <FileDown className="size-4" />
              Export to PDF
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
              disabled={exportDisabled}
              onClick={onExportMarkdown}
            >
              <FileCode2 className="size-4" />
              Export to Markdown
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
              onClick={() => {
                closePopover()
                onFind?.()
              }}
            >
              <ScanSearch className="size-4" />
              Find…
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal"
              onClick={() => {
                closePopover()
                onReplace?.()
              }}
            >
              <Replace className="size-4" />
              Replace…
            </Button>
          </div>
          <Separator className="my-1" />
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-full justify-start gap-2 px-2 text-sm font-normal text-red-600 hover:text-red-600"
            onClick={() => {
              closePopover()
              setDeleteOpen(true)
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </PopoverContent>
      </Popover>

      <RenameDialog
        open={renameOpen}
        currentTitle={noteTitle}
        noteId={noteId}
        onOpenChange={setRenameOpen}
        onRenamed={onRenamed}
      />

      <MoveFileDialog
        open={moveOpen}
        noteId={noteId}
        currentFolderId={currentFolderId}
        onOpenChange={setMoveOpen}
        onMoved={onMoved}
      />

      <DeleteAlertDialog
        open={deleteOpen}
        noteId={noteId}
        noteTitle={noteTitle}
        onOpenChange={setDeleteOpen}
        onDeleted={onDeleted}
      />
    </>
  )
}
