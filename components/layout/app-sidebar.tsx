"use client"

import { useDeferredValue, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  BadgeCheck,
  ChevronsUpDown,
  ChevronRight,
  CircleUserRound,
  Clock3,
  FileText,
  Files,
  Loader2,
  LogOut,
  Search,
  Settings,
  SquarePen,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const primarySidebarItems = [
  { label: "New Note", icon: SquarePen },
  { label: "Search", icon: Search },
  { label: "Explorer", icon: Files },
] as const
const collapsedIconButtonClass =
  "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:px-0"
const railIconSlotClass = "flex size-8 shrink-0 items-center justify-center"

const RECENT_SEARCHES_STORAGE_KEY = "synapse-note-searches"
const MAX_RECENT_SEARCHES = 6
const MAX_SEARCH_RESULTS = 20

type NoteSummary = {
  id: string
  title: string
  href: string
}

async function fetchNotes(): Promise<NoteSummary[]> {
  const response = await fetch("/api/notes", { cache: "no-store" })

  if (!response.ok) {
    return []
  }

  const data = (await response.json()) as { notes?: NoteSummary[] }
  return data.notes ?? []
}

function normalizeSearchTerm(value: string) {
  return value.trim().toLowerCase()
}

function getSearchMatchScore(title: string, query: string) {
  const normalizedTitle = title.toLowerCase()

  if (normalizedTitle === query) return 0
  if (normalizedTitle.startsWith(query)) return 1
  if (normalizedTitle.includes(query)) return 2

  return null
}

function filterNotesByTitle(notes: NoteSummary[], query: string) {
  const normalizedQuery = normalizeSearchTerm(query)

  if (!normalizedQuery) {
    return []
  }

  return notes
    .map((note, index) => ({
      note,
      index,
      score: getSearchMatchScore(note.title || "Untitled", normalizedQuery),
    }))
    .filter((entry) => entry.score !== null)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return (left.score ?? Number.POSITIVE_INFINITY) - (right.score ?? Number.POSITIVE_INFINITY)
      }

      return left.index - right.index
    })
    .slice(0, MAX_SEARCH_RESULTS)
    .map((entry) => entry.note)
}

function parseStoredRecentSearches(value: string | null) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, MAX_RECENT_SEARCHES)
  } catch {
    return []
  }
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
  const { isMobile, state } = useSidebar()
  const button = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/nav-item flex h-10 w-full items-center rounded-lg text-left text-[15px] text-sidebar-foreground outline-hidden",
        "cursor-pointer",
        "transition-[background-color,color] duration-200 ease-out",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsedIconButtonClass,
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
    >
      <span className={railIconSlotClass}>
        <Icon className="size-4" />
      </span>

      <span
        className={cn(
          "synapse-sidebar-label grid min-w-0 flex-1",
          "grid-cols-[1fr] pl-1 opacity-100 group-data-[collapsible=icon]:hidden"
        )}
      >
        <span className="min-w-0 overflow-hidden whitespace-nowrap">
          {label}
        </span>
      </span>
    </button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
        {label}
      </TooltipContent>
    </Tooltip>
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
  activePanel?: "explorer" | "search" | "recents" | null
  onPanelChange?: (panel: "explorer" | "search" | "recents" | null) => void
  user: {
    name: string | null
    email: string | null
    image: string | null
  } | null
}

export default function AppSidebar({
  activePanel = null,
  onPanelChange,
  user,
}: AppSidebarProps) {
  const { isMobile, setOpen, setOpenMobile, state } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const [allNotes, setAllNotes] = useState<NoteSummary[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [creatingNote, setCreatingNote] = useState(false)
  const [recentsOpen, setRecentsOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const recentNotes = allNotes.slice(0, 8)
  const matchingNotes = filterNotesByTitle(allNotes, deferredSearchQuery)
  const hasSearchQuery = normalizeSearchTerm(deferredSearchQuery).length > 0
  const showCollapsedTooltip = state === "collapsed" && !isMobile

  async function refreshNotes() {
    setLoadingNotes(true)
    try {
      setAllNotes(await fetchNotes())
    } finally {
      setLoadingNotes(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadNotes() {
      setLoadingNotes(true)
      try {
        const notes = await fetchNotes()

        if (active) {
          setAllNotes(notes)
        }
      } finally {
        if (active) {
          setLoadingNotes(false)
        }
      }
    }

    void loadNotes()

    return () => {
      active = false
    }
  }, [pathname])

  useEffect(() => {
    setRecentSearches(
      parseStoredRecentSearches(window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY))
    )
  }, [])

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

      const data = (await response.json()) as { href?: string }
      if (data.href) {
        router.push(data.href)
      }
      await refreshNotes()
    } finally {
      setCreatingNote(false)
    }
  }

  function persistRecentSearches(nextSearches: string[]) {
    setRecentSearches(nextSearches)
    window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(nextSearches))
  }

  function rememberSearch(query: string) {
    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
      return
    }

    const nextSearches = [
      normalizedQuery,
      ...recentSearches.filter(
        (entry) => normalizeSearchTerm(entry) !== normalizeSearchTerm(normalizedQuery)
      ),
    ].slice(0, MAX_RECENT_SEARCHES)

    persistRecentSearches(nextSearches)
  }

  function handleSearchOpenChange(nextOpen: boolean) {
    setSearchOpen(nextOpen)

    if (!nextOpen) {
      setSearchQuery("")
    }
  }

  function openSearchDialog(initialQuery = "") {
    if (isMobile) {
      setOpenMobile(false)
    }

    setSearchQuery(initialQuery)
    setSearchOpen(true)
  }

  function openSearchResult(note: NoteSummary) {
    rememberSearch(note.title || "Untitled")
    setSearchOpen(false)
    router.push(note.href)
  }

  function handleNavClick(label: string) {
    if (label === "New Note") {
      void createNote()
      return
    }

    if (label === "Search") {
      openSearchDialog()
      return
    }

    if (label !== "Explorer") {
      return
    }

    setOpen(false)
    onPanelChange?.(activePanel === "explorer" ? null : "explorer")
  }

  function handleRecentsOpenChange(nextOpen: boolean) {
    if (state === "collapsed") {
      setOpen(true)
      setRecentsOpen(true)
      return
    }

    setRecentsOpen(nextOpen)
  }

  const userName = user?.name?.trim() || "Synapse User"
  const userEmail = user?.email?.trim() || "account@synapse.app"
  const hasUserImage = Boolean(user?.image)
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-11 border-b border-sidebar-border p-0">
        <div className="flex h-full items-center px-3">
          <BrandLogo />
          <BrandTitle />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup className="px-3 pt-2 group-data-[collapsible=icon]:px-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {primarySidebarItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <NavItemButton
                    icon={item.label === "New Note" && creatingNote ? Loader2 : item.icon}
                    label={item.label}
                    isActive={item.label === "Explorer" && activePanel === "explorer"}
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "group/nav-item flex h-10 w-full items-center rounded-lg text-left text-[15px] text-sidebar-foreground outline-hidden",
                            "cursor-pointer",
                            "transition-[background-color,color] duration-200 ease-out",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                            collapsedIconButtonClass
                          )}
                        >
                          <span className={railIconSlotClass}>
                            <Clock3 className="size-4" />
                          </span>

                          <span
                            className={cn(
                              "synapse-sidebar-label grid min-w-0 flex-1",
                              "grid-cols-[1fr] pl-1 opacity-100 group-data-[collapsible=icon]:hidden"
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
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" hidden={!showCollapsedTooltip}>
                      Recents
                    </TooltipContent>
                  </Tooltip>
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
                    {loadingNotes && recentNotes.length === 0 ? (
                      <SidebarMenuItem>
                        <RecentItemButton>
                          Loading notes...
                        </RecentItemButton>
                      </SidebarMenuItem>
                    ) : null}

                    {!loadingNotes && recentNotes.length === 0 ? (
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

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-12 w-full items-center rounded-xl text-left text-sidebar-foreground outline-hidden",
                "cursor-pointer transition-colors duration-200 ease-out",
                "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsedIconButtonClass
              )}
            >
              <span className={cn(railIconSlotClass, "overflow-hidden rounded-full text-sidebar-foreground ring-1 ring-sidebar-border")}>
                {hasUserImage ? (
                  <span
                    aria-hidden="true"
                    className="size-full bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${user?.image}")` }}
                  />
                ) : (
                  <CircleUserRound className="size-[18px]" />
                )}
              </span>

              <span
                className={cn(
                  "synapse-sidebar-label grid min-w-0 flex-1",
                  "grid-cols-[1fr] pl-2 opacity-100 group-data-[collapsible=icon]:hidden"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium leading-4">
                    {userName}
                  </span>
                  <span className="block truncate pt-0.5 text-[12px] leading-4 text-sidebar-foreground/60">
                    {userEmail}
                  </span>
                </span>
              </span>

              <span className="synapse-sidebar-label flex shrink-0 items-center pl-2 pr-3 opacity-100 group-data-[collapsible=icon]:hidden">
                <ChevronsUpDown className="size-4 text-sidebar-foreground/60" />
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={12}
            alignOffset={-10}
            className="w-64 min-w-64 rounded-xl p-1.5"
          >
            <DropdownMenuLabel className="px-2 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sidebar-foreground ring-1 ring-border">
                  {hasUserImage ? (
                    <span
                      aria-hidden="true"
                      className="size-full bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url("${user?.image}")` }}
                    />
                  ) : (
                    <CircleUserRound className="size-[18px]" />
                  )}
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {userName}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {userEmail}
                  </span>
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BadgeCheck className="size-4" />
              Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="size-4 text-red-600" />
              <p className="text-red-600">Log out</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <CommandDialog
        open={searchOpen}
        onOpenChange={handleSearchOpenChange}
        title="Search Notes"
        description="Search note titles and reopen recent searches."
        className="max-w-xl"
      >
        <Command shouldFilter={false} loop>
          <CommandInput
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Search notes by title..."
          />
          <CommandList className="max-h-[26rem] px-1 pb-2">
            {hasSearchQuery ? (
              <CommandGroup heading="Matching notes">
                {loadingNotes && allNotes.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    Loading notes...
                  </div>
                ) : null}

                {!loadingNotes && matchingNotes.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    No note titles match &quot;{searchQuery.trim()}&quot;.
                  </div>
                ) : null}

                {matchingNotes.map((note) => (
                  <CommandItem
                    key={note.id}
                    value={`${note.title} ${note.href}`}
                    onSelect={() => openSearchResult(note)}
                  >
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      {note.title || "Untitled"}
                    </span>
                    {pathname === note.href ? (
                      <span className="text-xs text-muted-foreground">Open</span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                Type to filter note titles instantly.
              </div>
            )}

            {recentSearches.length > 0 ? (
              <>
                {hasSearchQuery ? <CommandSeparator /> : null}
                <CommandGroup heading="Recent searches">
                  {recentSearches.map((term) => (
                    <CommandItem
                      key={term}
                      value={`recent-${term}`}
                      onSelect={() => setSearchQuery(term)}
                    >
                      <Clock3 className="size-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{term}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            {!hasSearchQuery && recentSearches.length === 0 ? (
              <div className="px-3 pb-4 text-sm text-muted-foreground">
                Recent searches will appear here after you open a note from search.
              </div>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </Sidebar>
  )
}
