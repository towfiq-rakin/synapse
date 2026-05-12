"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Copy,
  ExternalLink,
  Globe2,
  Link2,
  Loader2,
  LockKeyhole,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type ShareState = {
  visibility: "private" | "unlisted" | "published"
  shareId: string | null
  shareUrl: string | null
  publishedUrl: string | null
  username: string
  isPublicProfile: boolean
}

type ShareNoteDialogProps = {
  noteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: (state: ShareState) => void
}

type NoteGetResponse = {
  note?: {
    fileName?: string
    title?: string
  }
  share?: ShareState
  error?: string
}

type PublishResponse = {
  success?: boolean
  share?: ShareState | null
  error?: string
}

type PublicProfileResponse = {
  success?: boolean
  profile?: {
    isPublicProfile?: boolean
  }
  error?: string
}

const visibilityOptions = [
  {
    value: "private" as const,
    title: "Private",
    description: "Only you can read this note.",
    icon: LockKeyhole,
  },
  {
    value: "unlisted" as const,
    title: "Unlisted link",
    description: "Anyone with the link can read it. It will not appear on your public profile.",
    icon: Link2,
  },
  {
    value: "published" as const,
    title: "Published on profile",
    description: "Visible in your public workspace explorer and note pages.",
    icon: Globe2,
  },
] as const

function toFriendlyError(message?: string) {
  if (!message) {
    return "Could not update sharing right now."
  }

  if (message === "Unauthorized") {
    return "Sign in again to change note sharing."
  }

  if (message === "Note not found") {
    return "This note could not be found."
  }

  if (message === "User not found") {
    return "Your profile could not be loaded."
  }

  if (message === "Invalid visibility") {
    return "Choose a valid visibility option."
  }

  return message
}

function buildAbsoluteUrl(path: string | null) {
  if (!path) {
    return null
  }

  return `${window.location.origin}${path}`
}

export default function ShareNoteDialog({
  noteId,
  open,
  onOpenChange,
  onUpdated,
}: ShareNoteDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [enablingProfile, setEnablingProfile] = useState(false)
  const [shareState, setShareState] = useState<ShareState | null>(null)
  const [selectedVisibility, setSelectedVisibility] = useState<ShareState["visibility"]>("private")
  const [noteTitle, setNoteTitle] = useState("Untitled")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) {
      setError("")
      return
    }

    let active = true
    setLoading(true)
    setError("")

    fetch(`/api/notes/${noteId}`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as NoteGetResponse | null

        if (!response.ok || !data?.share) {
          throw new Error(toFriendlyError(data?.error))
        }

        if (!active) {
          return
        }

        setNoteTitle(data.note?.title?.trim() || data.note?.fileName?.trim() || "Untitled")
        setShareState(data.share)
        setSelectedVisibility(data.share.visibility)
      })
      .catch((loadError) => {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Could not load sharing settings.")
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [noteId, open])

  const activePublicUrl = useMemo(() => {
    if (!shareState) {
      return null
    }

    if (selectedVisibility === "unlisted" && shareState.visibility === "unlisted") {
      return shareState.shareUrl
    }

    if (selectedVisibility === "published" && shareState.visibility === "published" && shareState.isPublicProfile) {
      return shareState.publishedUrl
    }

    return null
  }, [selectedVisibility, shareState])

  const hasPendingVisibilityChange = Boolean(shareState && selectedVisibility !== shareState.visibility)
  const isBlockedByPrivateProfile = selectedVisibility === "published" && !shareState?.isPublicProfile

  async function handleSaveVisibility() {
    if (!shareState) {
      return
    }

    if (isBlockedByPrivateProfile) {
      setError("Make your profile public before publishing this note.")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/notes/${noteId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: selectedVisibility }),
      })

      const data = (await response.json().catch(() => null)) as PublishResponse | null

      if (!response.ok || !data?.success || !data.share) {
        setError(toFriendlyError(data?.error))
        return
      }

      setShareState(data.share)
      setSelectedVisibility(data.share.visibility)
      onUpdated?.(data.share)
      startTransition(() => {
        router.refresh()
      })
      toast.success("Sharing updated.")
    } catch {
      setError("Network error. Could not update sharing.")
    } finally {
      setSaving(false)
    }
  }

  async function handleEnablePublicProfile() {
    setEnablingProfile(true)
    setError("")

    try {
      const response = await fetch("/api/settings/public-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublicProfile: true }),
      })

      const data = (await response.json().catch(() => null)) as PublicProfileResponse | null

      if (!response.ok || !data?.success) {
        setError(toFriendlyError(data?.error || "Could not enable your public profile."))
        return
      }

      setShareState((current) =>
        current
          ? {
              ...current,
              isPublicProfile: true,
            }
          : current,
      )
      startTransition(() => {
        router.refresh()
      })
      toast.success("Public profile enabled.")
    } catch {
      setError("Network error. Could not enable your public profile.")
    } finally {
      setEnablingProfile(false)
    }
  }

  async function handleCopyLink() {
    const absoluteUrl = buildAbsoluteUrl(activePublicUrl)

    if (!absoluteUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(absoluteUrl)
      toast.success("Link copied.")
    } catch {
      toast.error("Could not copy the link.")
    }
  }

  function handleOpenPublicView() {
    const absoluteUrl = buildAbsoluteUrl(activePublicUrl)

    if (!absoluteUrl) {
      return
    }

    window.open(absoluteUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] rounded-[28px] border border-border/80 p-0 shadow-2xl sm:max-w-xl">
        <div className="grid gap-5 p-5 sm:p-6">
          <DialogHeader className="gap-3">
            <DialogTitle className="text-2xl font-semibold tracking-tight">Share note</DialogTitle>
            <DialogDescription className="text-sm leading-6">
              Choose how readers can access <span className="font-medium text-foreground">{noteTitle}</span>.
              Private notes stay visible only to you.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center gap-2 rounded-[22px] border border-border/80 bg-muted/35 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading sharing settings…
            </div>
          ) : (
            <>
              <div role="radiogroup" className="grid gap-3">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon
                  const checked = selectedVisibility === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => {
                        setSelectedVisibility(option.value)
                        setError("")
                      }}
                      className={cn(
                        "cursor-pointer rounded-[22px] border px-4 py-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        checked
                          ? "border-foreground/10 bg-foreground text-background"
                          : "border-border/80 bg-background hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border",
                            checked
                              ? "border-background/20 bg-background/10 text-background"
                              : "border-border bg-muted/60 text-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{option.title}</p>
                          <p
                            className={cn(
                              "mt-1 text-sm leading-6",
                              checked ? "text-background/80" : "text-muted-foreground",
                            )}
                          >
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {isBlockedByPrivateProfile ? (
                <div className="rounded-[22px] border border-border/80 bg-muted/35 p-4">
                  <p className="text-sm font-medium text-foreground">Your public profile is still private.</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Published notes only appear on your profile after you make the workspace public.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleEnablePublicProfile}
                      disabled={enablingProfile}
                    >
                      {enablingProfile ? <Loader2 className="size-4 animate-spin" /> : null}
                      Make profile public
                    </Button>
                  </div>
                </div>
              ) : null}

              {activePublicUrl ? (
                <div className="rounded-[22px] border border-border/80 bg-background p-4">
                  <p className="text-sm font-medium text-foreground">Public link</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {selectedVisibility === "unlisted"
                      ? "Anyone with this link can read the note."
                      : "This is the published note URL on your public workspace."}
                  </p>
                  <div className="mt-4 grid gap-3">
                    <Input value={buildAbsoluteUrl(activePublicUrl) ?? ""} readOnly className="bg-background" />
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="outline" onClick={handleCopyLink}>
                        <Copy className="size-4" />
                        Copy link
                      </Button>
                      <Button type="button" variant="outline" onClick={handleOpenPublicView}>
                        <ExternalLink className="size-4" />
                        Open public view
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </>
          )}

          <DialogFooter className="gap-3 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={handleSaveVisibility}
              disabled={loading || saving || !shareState || !hasPendingVisibilityChange || isBlockedByPrivateProfile}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save visibility
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
