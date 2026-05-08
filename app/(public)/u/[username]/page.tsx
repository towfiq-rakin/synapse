import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, FileText } from "lucide-react";
import { format } from "date-fns";
import { getAuthenticatedUserId } from "@/lib/auth";
import PublicNoteArticle from "@/components/public/public-note-article";
import PublicNoteExplorer from "@/components/public/public-note-explorer";
import type { PublicReaderSearchItem } from "@/components/public/public-reader-search";
import PublicTableOfContents from "@/components/public/public-table-of-contents";
import PublicTopBar from "@/components/public/public-top-bar";
import PublicWorkspaceLayout from "@/components/public/public-workspace-layout";
import {
  buildPublicExcerpt,
  getPublicProfile,
  getPublicProfileHref,
  getPublishedWorkspaceTree,
  getResolvedPublicSnapshot,
} from "@/lib/publishing/public-queries";

type PublicProfileIndexPageProps = {
  params: Promise<{ username: string }>;
};

function buildProfileName(name: string, displayName: string | null) {
  return displayName || name;
}

function formatDateLabel(date: Date | null) {
  if (!date) {
    return null;
  }

  return format(date, "MMMM d, yyyy");
}

export async function generateMetadata({ params }: PublicProfileIndexPageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    return {
      title: "Not found | Synapse",
      robots: { index: false, follow: false },
    };
  }

  const profileName = buildProfileName(profile.name, profile.displayName);
  const description = profile.bio || `${profileName}'s published Synapse workspace.`;

  return {
    title: `${profileName} | Synapse`,
    description,
    openGraph: {
      title: `${profileName} | Synapse`,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfileIndexPage({ params }: PublicProfileIndexPageProps) {
  const { username } = await params;
  const [workspace, currentUserId] = await Promise.all([getPublishedWorkspaceTree(username), getAuthenticatedUserId()]);

  if (!workspace) {
    notFound();
  }

  const profileName = buildProfileName(workspace.profile.name, workspace.profile.displayName);
  const profileHref = getPublicProfileHref(workspace.profile.username);
  const publishedLabel = formatDateLabel(workspace.profile.publishedAt);
  const searchItems: PublicReaderSearchItem[] = workspace.notes.map((note) => ({
    id: note.id,
    title: note.title,
    href: note.href,
    pathLabel: note.path.length > 1 ? note.path.slice(0, -1).join(" / ") : "Workspace",
  }));
  const landingSnapshot = workspace.indexNote ? await getResolvedPublicSnapshot(workspace.indexNote) : null;
  const landingEditHref = workspace.indexNote && currentUserId === workspace.profile.id ? `/notes/${workspace.indexNote.id}` : null;
  const noteGroups = workspace.notes.reduce<
    Array<{
      key: string;
      label: string;
      notes: typeof workspace.notes;
    }>
  >((groups, note) => {
    const label = note.path.length > 1 ? note.path.slice(0, -1).join(" / ") : "Workspace";
    const key = label.toLowerCase();
    const existing = groups.find((group) => group.key === key);

    if (existing) {
      existing.notes.push(note);
      return groups;
    }

    groups.push({
      key,
      label,
      notes: [note],
    });

    return groups;
  }, []);

  return (
    <PublicWorkspaceLayout
      topBar={<PublicTopBar searchItems={searchItems} />}
      explorer={
        <PublicNoteExplorer
          roots={workspace.roots}
          unfiledNotes={workspace.unfiledNotes}
        />
      }
      article={workspace.indexNote && landingSnapshot ? (
        <PublicNoteArticle
          note={workspace.indexNote}
          profile={workspace.profile}
          html={landingSnapshot.html}
          profileHref={profileHref}
          editHref={landingEditHref}
        />
      ) : (
        <section className="mx-auto w-full max-w-[48rem] text-card-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Public profile
            </span>
            {publishedLabel ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock3 className="size-3.5" />
                Live since {publishedLabel}
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{profileName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">@{workspace.profile.username}</p>

          {workspace.profile.bio ? (
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">{workspace.profile.bio}</p>
          ) : (
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
              Published notes from this Synapse workspace.
            </p>
          )}

          <div className="mt-8 border-t border-border/70 pt-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Published notes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {workspace.publishedNoteCount} notes across {workspace.folderCount} folders
                </p>
              </div>
            </div>

            {workspace.notes.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-border/70 bg-muted/35 p-5 text-sm text-muted-foreground">
                This workspace does not have any published notes yet.
              </div>
            ) : (
              <div className="mt-6 space-y-8">
                {noteGroups.map((group) => (
                  <section key={group.key}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="mt-3 space-y-3">
                      {group.notes.map((note) => {
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
                                {excerpt ? (
                                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{excerpt}</p>
                                ) : null}
                              </div>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {formatDateLabel(note.updatedAt) ?? "Updated recently"}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
      toc={workspace.indexNote && landingSnapshot ? <PublicTableOfContents items={landingSnapshot.toc} /> : undefined}
    />
  );
}
