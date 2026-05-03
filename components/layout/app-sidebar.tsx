"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronRight,
  Clock3,
  Files,
  Loader2,
  Search,
  SquarePen,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

const primarySidebarItems = [
  { label: "New Note", icon: SquarePen },
  { label: "Search", icon: Search },
  { label: "Explorer", icon: Files },
] as const

type RecentNote = {
  id: string
  title: string
  href: string
}

async function fetchRecentNotes(): Promise<RecentNote[]> {
  const response = await fetch("/api/notes", { cache: "no-store" })

  if (!response.ok) {
    return []
  }

  const data = (await response.json()) as { notes?: RecentNote[] }
  return (data.notes ?? []).slice(0, 8)
}

function NavItemButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: (typeof primarySidebarItems)[number]["icon"]
  label: string
  isActive?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/nav-item flex h-10 w-full items-center rounded-lg text-left text-[15px] text-sidebar-foreground outline-hidden",
        "cursor-pointer",
        "transition-[background-color,color] duration-200 ease-out",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center">
        <Icon className="size-4" />
      </span>

      <span
        className={cn(
          "synapse-sidebar-label grid min-w-0 flex-1",
          "grid-cols-[1fr] pl-1 opacity-100"
        )}
      >
        <span className="min-w-0 overflow-hidden whitespace-nowrap">
          {label}
        </span>
      </span>
    </button>
  )
}

function BrandTitle() {
  return (
    <div
      className={cn(
        "synapse-sidebar-brand grid min-w-0 flex-1",
        "grid-cols-[1fr] pl-2 opacity-100"
      )}
    >
      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-2xl font-semibold leading-none [font-family:var(--font-brand-yatra)]">Synapse</p>
      </div>
    </div>
  )
}

function BrandLogo() {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center text-sidebar-foreground" aria-hidden="true">
      <span
        className="block size-6 bg-current"
        style={{
          WebkitMaskImage: "url('/synapse.svg')",
          maskImage: "url('/synapse.svg')",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    </div>
  )
}

function RecentItemButton({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/recent-item h-auto min-h-10 w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-[15px] leading-5",
        "synapse-sidebar-secondary-transition",
        "transition-[background-color,color] duration-200 ease-out",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        "group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:min-h-0 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:opacity-0"
      )}
    >
      <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
    </button>
  )
}

type AppSidebarProps = {
  explorerOpen?: boolean
  onExplorerToggle?: () => void
}

export default function AppSidebar({
  explorerOpen = false,
  onExplorerToggle,
}: AppSidebarProps) {
  const { setOpen, state } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([])
  const [loadingRecents, setLoadingRecents] = useState(false)
  const [creatingNote, setCreatingNote] = useState(false)
  const [recentsOpen, setRecentsOpen] = useState(true)

  async function refreshRecents() {
    setLoadingRecents(true)
    try {
      setRecentNotes(await fetchRecentNotes())
    } finally {
      setLoadingRecents(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadRecents() {
      setLoadingRecents(true)
      try {
        const notes = await fetchRecentNotes()

        if (active) {
          setRecentNotes(notes)
        }
      } finally {
        if (active) {
          setLoadingRecents(false)
        }
      }
    }

    void loadRecents()

    return () => {
      active = false
    }
  }, [pathname])

  async function createNote() {
    setCreatingNote(true)
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled",
          content: "",
          contentText: "",
        }),
      })

      if (!response.ok) {
        return
      }

      const data = (await response.json()) as { href?: string; notes?: RecentNote[] }
      if (data.href) {
        router.push(data.href)
      }
      await refreshRecents()
    } finally {
      setCreatingNote(false)
    }
  }

  function handleNavClick(label: string) {
    if (label === "New Note") {
      void createNote()
      return
    }

    if (label !== "Explorer") {
      return
    }

    setOpen(false)
    onExplorerToggle?.()
  }

  function handleRecentsOpenChange(nextOpen: boolean) {
    if (state === "collapsed") {
      setOpen(true)
      setRecentsOpen(true)
      return
    }

    setRecentsOpen(nextOpen)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-11 border-b border-sidebar-border p-0">
        <div className="flex h-full items-center px-3">
          <BrandLogo />
          <BrandTitle />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup className="px-3 pt-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {primarySidebarItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <NavItemButton
                    icon={item.label === "New Note" && creatingNote ? Loader2 : item.icon}
                    label={item.label}
                    isActive={item.label === "Explorer" && explorerOpen}
                    onClick={() => handleNavClick(item.label)}
                  />
                </SidebarMenuItem>
              ))}

              <Collapsible
                open={recentsOpen}
                onOpenChange={handleRecentsOpenChange}
                className="group/recents"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "group/nav-item flex h-10 w-full items-center rounded-lg text-left text-[15px] text-sidebar-foreground outline-hidden",
                        "cursor-pointer",
                        "transition-[background-color,color] duration-200 ease-out",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center">
                        <Clock3 className="size-4" />
                      </span>

                      <span
                        className={cn(
                          "synapse-sidebar-label grid min-w-0 flex-1",
                          "grid-cols-[1fr] pl-1 opacity-100"
                        )}
                      >
                        <span className="min-w-0 overflow-hidden whitespace-nowrap">
                          Recents
                        </span>
                      </span>

                      <ChevronRight
                        className={cn(
                          "synapse-sidebar-toggle-icon mr-2 size-4 shrink-0 text-sidebar-foreground/60",
                          "transition-transform duration-200 ease-out group-data-[state=open]/recents:rotate-90",
                          "group-data-[collapsible=icon]:hidden"
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                </SidebarMenuItem>

                <CollapsibleContent
                  className={cn(
                    "synapse-sidebar-secondary-transition min-h-0 overflow-hidden",
                    "data-[state=closed]:max-h-0 data-[state=closed]:opacity-0",
                    "data-[state=open]:max-h-[520px] data-[state=open]:opacity-100",
                    "group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:max-h-0 group-data-[collapsible=icon]:opacity-0"
                  )}
                >
                  <SidebarMenu className="mt-1 gap-1">
                    {loadingRecents && recentNotes.length === 0 ? (
                      <SidebarMenuItem>
                        <RecentItemButton>
                          Loading notes...
                        </RecentItemButton>
                      </SidebarMenuItem>
                    ) : null}

                    {!loadingRecents && recentNotes.length === 0 ? (
                      <SidebarMenuItem>
                        <RecentItemButton onClick={() => void createNote()}>
                          Create first note
                        </RecentItemButton>
                      </SidebarMenuItem>
                    ) : null}

                    {recentNotes.map((note) => (
                      <SidebarMenuItem key={note.id}>
                        <RecentItemButton
                          isActive={pathname === note.href}
                          onClick={() => router.push(note.href)}
                        >
                          {note.title || "Untitled"}
                        </RecentItemButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
