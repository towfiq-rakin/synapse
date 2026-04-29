"use client"

import {
  Brain,
  Clock3,
  Files,
  Search,
  SquarePen,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { label: "New Note", icon: SquarePen },
  { label: "Search", icon: Search },
  { label: "Explorer", icon: Files },
  { label: "Recents", icon: Clock3 },
] as const

const recentItems = [
  "Docker vs NPM Run",
  "Scoreboard Alternatives",
  "Decompiler Picks for IDA",
  "IDA Pro vs Ghidra",
  "DevOps and Cloud Future",
] as const

function NavItemButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: (typeof sidebarItems)[number]["icon"]
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
        <p className="truncate text-2xl font-semibold leading-none">Synapse</p>
      </div>
    </div>
  )
}

function BrandLogo() {
  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center text-sidebar-foreground"
      aria-hidden="true"
    >
      <Brain className="size-4" />
    </div>
  )
}

function RecentItemButton({
  children,
  isActive,
}: {
  children: React.ReactNode
  isActive?: boolean
}) {
  return (
    <SidebarMenuButton
      type="button"
      isActive={isActive}
      className={cn(
        "h-auto min-h-10 rounded-xl px-3 py-2.5 text-[15px] leading-5 whitespace-normal",
        "synapse-sidebar-secondary-transition",
        "group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:min-h-0 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:opacity-0"
      )}
    >
      <span className="overflow-hidden">{children}</span>
    </SidebarMenuButton>
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
  const { setOpen } = useSidebar()

  function handleNavClick(label: string) {
    if (label !== "Explorer") {
      return
    }

    setOpen(false)
    onExplorerToggle?.()
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
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <NavItemButton
                    icon={item.icon}
                    label={item.label}
                    isActive={item.label === "Explorer" && explorerOpen}
                    onClick={() => handleNavClick(item.label)}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator
          className={cn(
            "synapse-sidebar-secondary-transition mt-3",
            "group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:opacity-0"
          )}
        />

        <SidebarGroup
          className={cn(
            "synapse-sidebar-secondary-transition min-h-0 flex-1 overflow-hidden px-2 py-3",
            "max-h-[520px] opacity-100",
            "group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:max-h-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:opacity-0"
          )}
        >
          <SidebarGroupLabel
            className={cn(
              "synapse-sidebar-secondary-transition px-3 text-[13px] text-sidebar-foreground/55",
              "group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:opacity-0"
            )}
          >
            Recents
          </SidebarGroupLabel>

          <SidebarGroupContent className="min-h-0 flex-1 overflow-hidden">
            <SidebarMenu>
              {recentItems.map((item, index) => (
                <SidebarMenuItem key={item}>
                  <RecentItemButton isActive={index === 0}>{item}</RecentItemButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
