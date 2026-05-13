import type { ReactNode } from "react";
import BackToTopButton from "@/components/public/back-to-top-button";
import { cn } from "@/lib/utils";

type PublicWorkspaceLayoutProps = {
  topBar: ReactNode;
  explorer?: ReactNode;
  article: ReactNode;
  toc?: ReactNode;
};

function MobileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="rounded-xl border border-border/70 bg-background p-3">
      <summary className="cursor-pointer list-none text-sm font-medium text-foreground">{title}</summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}

export default function PublicWorkspaceLayout({
  topBar,
  explorer,
  article,
  toc,
}: PublicWorkspaceLayoutProps) {
  const hasExplorer = Boolean(explorer);
  const hasToc = Boolean(toc);
  const desktopGridClassName = cn(
    "gap-10 lg:grid",
    hasExplorer
      ? "lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,820px)_240px]"
      : hasToc
        ? "lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,820px)_240px] xl:justify-center"
        : "lg:grid-cols-[minmax(0,820px)] lg:justify-center",
  );

  return (
    <div className="min-h-svh bg-background">
      {topBar}

      <main className="mx-auto w-full max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div
          className={cn(
            "space-y-4 lg:space-y-0",
            hasExplorer || hasToc ? desktopGridClassName : "lg:block",
          )}
        >
          {hasExplorer ? (
            <>
              <div className="lg:hidden">
                <MobileSection title="Explorer">{explorer}</MobileSection>
              </div>
              <aside className="hidden lg:block lg:sticky lg:top-20 lg:h-fit lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
                {explorer}
              </aside>
            </>
          ) : null}

          <section className="min-w-0">{article}</section>

          {hasToc ? (
            <>
              <div className="lg:hidden">
                <MobileSection title="Table of contents">{toc}</MobileSection>
              </div>
              <aside className="hidden xl:block xl:sticky xl:top-20 xl:h-fit xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto xl:overscroll-contain">
                {toc}
              </aside>
            </>
          ) : null}
        </div>
      </main>

      <BackToTopButton />
    </div>
  );
}
