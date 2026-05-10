import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, FolderOpen } from "lucide-react";
import { getAuthenticatedUserId } from "@/lib/auth";
import PublicNoteArticle from "@/components/public/public-note-article";
import PublicNoteExplorer from "@/components/public/public-note-explorer";
import type { PublicReaderSearchItem } from "@/components/public/public-reader-search";
import PublicTableOfContents from "@/components/public/public-table-of-contents";
import PublicTopBar from "@/components/public/public-top-bar";
import PublicWorkspaceLayout from "@/components/public/public-workspace-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  buildPublicExcerpt,
  getPublishedFolderListing,
  getPublicProfileHref,
  getPublishedNoteByPath,
  getPublishedWorkspaceTree,
  getResolvedPublicSnapshot,
} from "@/lib/publishing/public-queries";

type PublicProfileNotePageProps = {
  params: Promise<{ username: string; notePath: string[] }>;
};

function formatFolderLabel(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: PublicProfileNotePageProps): Promise<Metadata> {
  const { username, notePath } = await params;
  const [result, workspace] = await Promise.all([getPublishedNoteByPath(username, notePath), getPublishedWorkspaceTree(username)]);

  if (!workspace) {
    return {
      title: "Not found | Synapse",
      robots: { index: false, follow: false },
    };
  }

  if (!result) {
    const folderListing = getPublishedFolderListing(workspace, notePath);

    if (!folderListing) {
      return {
        title: "Not found | Synapse",
        robots: { index: false, follow: false },
      };
    }

    const profileName = folderListing.folder.name;
    const description = folderListing.notes.length > 0
      ? `Published notes in ${folderListing.folder.name}.`
      : `Published folder ${folderListing.folder.name}.`;

    return {
      title: `${profileName} | ${workspace.profile.displayName || workspace.profile.name}`,
      description,
      openGraph: {
        title: `${profileName} | ${workspace.profile.displayName || workspace.profile.name}`,
        description,
      },
      robots: { index: true, follow: true },
    };
  }

  const snapshot = await getResolvedPublicSnapshot(result.note);
  const profileName = result.profile.displayName || result.profile.name;
  const description = buildPublicExcerpt(
    {
      ...result.note,
      publicHtml: snapshot.html,
      publicMarkdown: snapshot.markdown,
    },
    170,
  );

  return {
    title: `${result.note.title} | ${profileName}`,
    description: description ?? `${result.note.title} by ${profileName}`,
    openGraph: {
      title: `${result.note.title} | ${profileName}`,
      description: description ?? `${result.note.title} by ${profileName}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfileNotePage({ params }: PublicProfileNotePageProps) {
  const { username, notePath } = await params;
  const [workspace, result, currentUserId] = await Promise.all([
    getPublishedWorkspaceTree(username),
    getPublishedNoteByPath(username, notePath),
    getAuthenticatedUserId(),
  ]);

  if (!workspace) {
    notFound();
  }

  const folderListing = result ? null : getPublishedFolderListing(workspace, notePath);

  if (!result && !folderListing) {
    notFound();
  }

  const profileHref = getPublicProfileHref(workspace.profile.username);
  const searchItems: PublicReaderSearchItem[] = workspace.notes.map((note) => ({
    id: note.id,
    title: note.title,
    href: note.href,
    pathLabel: note.path.length > 1 ? note.path.slice(0, -1).join(" / ") : "Workspace",
  }));

  if (!result && folderListing) {
    return (
      <PublicWorkspaceLayout
        topBar={<PublicTopBar searchItems={searchItems} />}
        explorer={
          <PublicNoteExplorer
            roots={workspace.roots}
            unfiledNotes={workspace.unfiledNotes}
          />
        }
        article={
          <section className="mx-auto w-full max-w-[48rem] text-card-foreground">
            <Breadcrumb>
              <BreadcrumbList className="gap-1.5 text-sm text-muted-foreground sm:text-[0.95rem]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={profileHref}>@{workspace.profile.username}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {folderListing.folder.path.map((segment, index) => {
                  const href = `${profileHref}/${folderListing.folder.path.slice(0, index + 1).join("/")}`;
                  const isCurrent = index === folderListing.folder.path.length - 1;

                  return (
                    <BreadcrumbItem key={`${segment}-${index}`}>
                      <BreadcrumbSeparator />
                      {isCurrent ? (
                        <BreadcrumbPage>{formatFolderLabel(segment)}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={href}>{formatFolderLabel(segment)}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-5 flex items-center gap-3">
              <FolderOpen className="size-5 text-muted-foreground" />
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{folderListing.folder.name}</h1>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              {folderListing.notes.length} published {folderListing.notes.length === 1 ? "note" : "notes"} in this directory and its subdirectories.
            </p>

            <div className="mt-8 space-y-3">
              {folderListing.notes.map((note) => {
                const excerpt = buildPublicExcerpt(note, 180);

                return (
                  <Link
                    key={note.id}
                    href={note.href}
                    className="block rounded-lg border border-border/70 bg-background p-3.5 transition-colors hover:bg-muted/35"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 text-base font-medium text-foreground">
                          <FileText className="size-4 text-muted-foreground" />
                          <span className="truncate">{note.title}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{note.href.replace(`${profileHref}/`, "")}</p>
                        {excerpt ? (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{excerpt}</p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}

              {folderListing.notes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                  No published notes in this directory yet.
                </div>
              ) : null}
            </div>
          </section>
        }
      />
    );
  }

  if (!result) {
    notFound();
  }

  const snapshot = await getResolvedPublicSnapshot(result.note);
  const editHref = currentUserId === result.profile.id ? `/notes/${result.note.id}` : null;

  return (
    <PublicWorkspaceLayout
      topBar={<PublicTopBar searchItems={searchItems} editHref={editHref} />}
      explorer={
        <PublicNoteExplorer
          roots={workspace.roots}
          unfiledNotes={workspace.unfiledNotes}
          activeHref={result.note.href}
        />
      }
      article={
        <PublicNoteArticle
          note={result.note}
          profile={result.profile}
          html={snapshot.html}
          profileHref={profileHref}
          editHref={editHref}
        />
      }
      toc={<PublicTableOfContents items={snapshot.toc} />}
    />
  );
}
