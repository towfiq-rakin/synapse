import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import AutoSyncNoteEditor from "@/components/editor/auto-sync-note-editor";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import User from "@/lib/db/models/User";
import Folder from "@/lib/db/models/Folder";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import { findFolderIdBySegments, normalizePathSegments, type FolderPathNode } from "@/lib/notes-path";

type PublicPathPageProps = {
  params: Promise<{ username: string; notePath: string[] }>;
};

type PublicNote = {
  _id: { toString(): string } | string;
  title: string;
  content: string;
  folderId: { toString(): string } | string | null;
};

function isLikelyHtml(input: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

async function renderNoteHtml(content: string): Promise<string> {
  if (!content.trim()) {
    return "<p>This note is empty.</p>";
  }

  if (isLikelyHtml(content)) {
    return content;
  }

  const file = await remark()
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(content);

  return String(file);
}

export default async function PublicPathPage({ params }: PublicPathPageProps) {
  const session = await auth();
  const { username, notePath } = await params;
  const normalizedPath = normalizePathSegments(notePath);

  if (normalizedPath.length === 0) {
    notFound();
  }

  const noteSlug = normalizedPath.at(-1);
  const folderPath = normalizedPath.slice(0, -1);

  if (!noteSlug) {
    notFound();
  }

  await connectToDatabase();

  const user = await User.findOne({ username: username.toLowerCase() })
    .select("_id username")
    .lean<{ _id: { toString(): string } | string; username: string } | null>();

  if (!user) {
    notFound();
  }

  const userId = typeof user._id === "string" ? user._id : user._id.toString();
  const isOwner = session?.user?.id === userId;

  const folders = await Folder.find({ userId })
    .select("_id slug parentId")
    .lean<FolderPathNode[]>();

  const folderId = findFolderIdBySegments(folders, folderPath);

  if (folderId === undefined) {
    notFound();
  }

  const note = await Note.findOne({
    userId,
    folderId,
    slug: noteSlug,
    ...(isOwner ? {} : { visibility: "public" }),
  })
    .select("_id title content folderId")
    .lean<PublicNote | null>();

  if (!note) {
    notFound();
  }

  if (isOwner) {
    return (
      <AutoSyncNoteEditor
        noteId={typeof note._id === "string" ? note._id : note._id.toString()}
        initialTitle={note.title || "Untitled"}
        initialContent={note.content || ""}
        initialFolderId={typeof note.folderId === "string" ? note.folderId : note.folderId?.toString() ?? null}
      />
    );
  }

  const renderedHtml = await renderNoteHtml(note.content);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="rounded-xl border bg-card p-6 text-card-foreground sm:p-8">
        <h1 className="mb-6 text-3xl font-semibold">{note.title || "Untitled"}</h1>
        <div
          className="prose prose-slate max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </article>
    </main>
  );
}
