"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { PanelLeftIcon } from "lucide-react"
import AppSidebar from "@/components/layout/app-sidebar"
import ExplorerSidebar from "@/components/layout/explorer-sidebar"
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type AppShellProps = {
  children: React.ReactNode
  defaultOpen: boolean
  user: {
    name: string | null
    email: string | null
    image: string | null
  } | null
}

type SidebarPanel = "explorer" | "search" | "recents" | null

function DesktopSidebarControl({
  activePanel,
  onPanelChange,
}: {
  activePanel: SidebarPanel
  onPanelChange: (panel: SidebarPanel) => void
}) {
  const { toggleSidebar } = useSidebar()

  return (
    <div className="pointer-events-none sticky top-0 z-[60] hidden h-0 md:block">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        data-sidebar="trigger"
        data-slot="sidebar-trigger"
        className="pointer-events-auto ml-1 mt-1.5"
        onClick={() => {
          if (activePanel) {
            onPanelChange(null)
            return
          }

          toggleSidebar()
        }}
      >
        <PanelLeftIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    </div>
  )
}

export default function AppShell({ children, defaultOpen, user }: AppShellProps) {
  const [activePanel, setActivePanel] = useState<SidebarPanel>(null)
  const pathname = usePathname()
  const showMobileShellHeader = !pathname.startsWith("/notes/")
  const showMobileShellThemeToggle = !pathname.startsWith("/notes/")

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        user={user}
      />
      <ExplorerSidebar open={activePanel === "explorer"} />
      <SidebarInset
        className={cn(
          "h-svh min-h-svh overflow-hidden transition-[margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          activePanel === "explorer" && "md:ml-56"
        )}
      >
        {showMobileShellHeader ? (
          <header className="sticky top-0 z-20 flex items-center justify-between pl-3 pr-2 py-3 md:hidden">
            <SidebarTrigger />
            {showMobileShellThemeToggle ? <ThemeToggle /> : null}
          </header>
        ) : null}
        <DesktopSidebarControl
          activePanel={activePanel}
          onPanelChange={setActivePanel}
        />
        <div className="synapse-editor-shell min-h-0 flex-1 overflow-auto overscroll-contain">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
