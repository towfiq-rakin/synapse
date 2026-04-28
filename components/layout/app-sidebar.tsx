"use client";

import {
  Clock3,
  Files,
  PanelLeft,
  Search,
  SquarePen,
} from "lucide-react";
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
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "New Note", icon: SquarePen },
  { label: "Search", icon: Search },
  { label: "Files", icon: Files },
  { label: "Recents", icon: Clock3 },
] as const;

const recentItems = [
  "Docker vs NPM Run",
  "CTFd Scoreboard Alternatives",
  "Decompiler Picks for IDA",
  "IDA Pro vs Ghidra CTF",
  "DevOps and Cloud Future",
] as const;

function NavItemButton({
  icon: Icon,
  label,
}: {
  icon: (typeof sidebarItems)[number]["icon"];
  label: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center rounded-lg px-0 text-left text-[15px] text-sidebar-foreground outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center">
        <Icon className="size-4" />
      </span>
      <span
        className={cn(
          "grid min-w-0 flex-1 transition-[grid-template-columns,padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "grid-cols-[1fr] pl-1",
          "group-data-[collapsible=icon]:grid-cols-[0fr] group-data-[collapsible=icon]:pl-0"
        )}
      >
        <span className="overflow-hidden whitespace-nowrap transition-opacity delay-75 duration-200 ease-linear group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:opacity-0">
          {label}
        </span>
      </span>
    </button>
  );
}

function CollapseButton() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-hidden"
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isCollapsed ? (
        <PanelLeft className="size-4" />
      ) : (
        <PanelLeft className="size-4" />
      )}
    </button>
  );
}

export default function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <div className="min-w-0 flex-1 overflow-hidden transition-[width,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:opacity-0">
            <p className="truncate text-2xl font-semibold leading-none">Synapse</p>
          </div>
          <CollapseButton />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup className="px-2 pt-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.label}>
                    <NavItemButton icon={Icon} label={item.label} />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mt-3 group-data-[collapsible=icon]:hidden" />

        <SidebarGroup className="min-h-0 flex-1 px-2 py-3 group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="px-3 text-[13px] text-sidebar-foreground/55">
            Recents
          </SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1">
            <SidebarMenu>
              {recentItems.map((item, index) => (
                <SidebarMenuItem key={item}>
                  <SidebarMenuButton
                    type="button"
                    isActive={index === 0}
                    className="h-auto min-h-10 rounded-xl px-3 py-2.5 text-[15px] leading-5 whitespace-normal"
                  >
                    <span>{item}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
