import Link from "next/link";
import { Button } from "@/components/ui/button";
import PublicReaderSearch, { type PublicReaderSearchItem } from "@/components/public/public-reader-search";
import PublicThemeControls from "@/components/public/public-theme-controls";

type PublicTopBarProps = {
  searchItems?: PublicReaderSearchItem[];
  editHref?: string | null;
};

export default function PublicTopBar({
  searchItems = [],
  editHref,
}: PublicTopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-[1540px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex shrink-0 items-center gap-2.5 text-foreground">
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-border/80 bg-muted/40" aria-hidden="true">
            <span
              className="block size-5 bg-current"
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
          </span>
          <span className="truncate text-lg font-semibold leading-none [font-family:var(--font-theme-lora)]">Synapse</span>
        </Link>

        <div className="min-w-0 flex-1">
          {searchItems.length > 0 ? (
            <PublicReaderSearch items={searchItems} className="max-w-xl" />
          ) : (
            <div className="hidden h-10 max-w-xl rounded-lg border border-transparent sm:block" aria-hidden="true" />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <PublicThemeControls />

          {editHref ? (
            <Button asChild variant="outline" size="sm" className="h-10 shrink-0 rounded-lg px-3">
              <Link href={editHref}>Edit</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
