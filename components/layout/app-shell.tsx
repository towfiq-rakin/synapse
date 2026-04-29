"use client"

import { useState } from "react"
import AppSidebar from "@/components/layout/app-sidebar"
import ExplorerSidebar from "@/components/layout/explorer-sidebar"
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type AppShellProps = {
  children: React.ReactNode
  defaultOpen: boolean
}

export default function AppShell({ children, defaultOpen }: AppShellProps) {
  const [explorerOpen, setExplorerOpen] = useState(false)

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        explorerOpen={explorerOpen}
        onExplorerToggle={() => setExplorerOpen((open) => !open)}
      />
      <ExplorerSidebar open={explorerOpen} />
      <SidebarInset
        className={cn(
          "min-h-svh transition-[margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          explorerOpen && "md:ml-56"
        )}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between px-3 py-3 md:hidden">
          <SidebarTrigger />
          <ThemeToggle />
        </header>
        {!explorerOpen ? (
          <div className="pointer-events-none sticky top-0 z-[60] hidden h-0 md:block">
            <SidebarTrigger className="pointer-events-auto ml-1 mt-1.5" />
          </div>
        ) : null}
        <div className="synapse-editor-shell min-h-0 flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
