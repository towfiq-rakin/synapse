"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type PublicReaderSearchItem = {
  id: string;
  title: string;
  href: string;
  pathLabel?: string | null;
};

type PublicReaderSearchProps = {
  items: PublicReaderSearchItem[];
  className?: string;
};

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function getMatchScore(item: PublicReaderSearchItem, query: string) {
  const title = item.title.toLowerCase();
  const path = item.pathLabel?.toLowerCase() ?? "";

  if (title === query) return 0;
  if (title.startsWith(query)) return 1;
  if (title.includes(query)) return 2;
  if (path.startsWith(query)) return 3;
  if (path.includes(query)) return 4;

  return null;
}

export default function PublicReaderSearch({
  items,
  className,
}: PublicReaderSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const normalizedQuery = normalizeQuery(deferredQuery);

    if (!normalizedQuery) {
      return items.slice(0, 12);
    }

    return items
      .map((item, index) => ({
        item,
        index,
        score: getMatchScore(item, normalizedQuery),
      }))
      .filter((entry) => entry.score !== null)
      .sort((left, right) => {
        if (left.score !== right.score) {
          return (left.score ?? Number.POSITIVE_INFINITY) - (right.score ?? Number.POSITIVE_INFINITY);
        }

        return left.index - right.index;
      })
      .slice(0, 16)
      .map((entry) => entry.item);
  }, [deferredQuery, items]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");

    startTransition(() => {
      router.push(href);
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-10 w-full items-center gap-3 rounded-lg border border-border/70 bg-background px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        aria-label="Search published notes"
      >
        <Search className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">Search published notes...</span>
        <span className="hidden rounded-md border border-border/70 px-1.5 py-0.5 text-[11px] uppercase tracking-[0.18em] sm:inline-block">
          Ctrl K
        </span>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search published notes"
        description="Search this public workspace by note title or path."
        className="max-w-2xl"
      >
        <Command shouldFilter={false} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search published notes..."
            autoFocus
          />
          <CommandList className="max-h-[24rem]">
            <CommandEmpty>No matching notes found.</CommandEmpty>
            <CommandGroup heading="Published notes">
              {results.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.pathLabel ?? ""}`}
                  onSelect={() => handleSelect(item.href)}
                  className="items-start gap-3 py-3"
                >
                  <FileText className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    {item.pathLabel ? (
                      <p className="truncate text-xs text-muted-foreground">{item.pathLabel}</p>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
