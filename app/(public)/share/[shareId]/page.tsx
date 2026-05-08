import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/auth";
import PublicNoteArticle from "@/components/public/public-note-article";
import type { PublicReaderSearchItem } from "@/components/public/public-reader-search";
import PublicTableOfContents from "@/components/public/public-table-of-contents";
import PublicTopBar from "@/components/public/public-top-bar";
import PublicWorkspaceLayout from "@/components/public/public-workspace-layout";
import {
  buildPublicExcerpt,
  getPublicProfileHref,
  getPublishedWorkspaceTree,
  getResolvedPublicSnapshot,
  getUnlistedNoteByShareId,
} from "@/lib/publishing/public-queries";

type PublicSharePageProps = {
  params: Promise<{ shareId: string }>;
};

export async function generateMetadata({ params }: PublicSharePageProps): Promise<Metadata> {
  const { shareId } = await params;
  const result = await getUnlistedNoteByShareId(shareId);

  if (!result) {
    return {
      title: "Not found | Synapse",
      robots: { index: false, follow: false },
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
    title: `${result.note.title} | Shared by ${profileName}`,
    description: description ?? `${result.note.title} shared from Synapse`,
    openGraph: {
      title: `${result.note.title} | Shared by ${profileName}`,
      description: description ?? `${result.note.title} shared from Synapse`,
    },
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PublicSharePage({ params }: PublicSharePageProps) {
  const { shareId } = await params;
  const [result, currentUserId] = await Promise.all([getUnlistedNoteByShareId(shareId), getAuthenticatedUserId()]);

  if (!result) {
    notFound();
  }

  const workspace = result.profile.isPublicProfile
    ? await getPublishedWorkspaceTree(result.profile.username)
    : null;
  const snapshot = await getResolvedPublicSnapshot(result.note);
  const editHref = currentUserId === result.profile.id ? `/notes/${result.note.id}` : null;
  const profileHref = result.profile.isPublicProfile ? getPublicProfileHref(result.profile.username) : null;
  const searchItems: PublicReaderSearchItem[] = workspace
    ? workspace.notes.map((note) => ({
        id: note.id,
        title: note.title,
        href: note.href,
        pathLabel: note.path.length > 1 ? note.path.slice(0, -1).join(" / ") : "Workspace",
      }))
    : [];

  return (
    <PublicWorkspaceLayout
      topBar={<PublicTopBar searchItems={searchItems} editHref={editHref} />}
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
