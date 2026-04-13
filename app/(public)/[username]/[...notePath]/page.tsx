import { notFound } from "next/navigation";
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
  title: string;
  content: string;
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
    visibility: "public",
  })
    .select("title content")
    .lean<PublicNote | null>();

  if (!note) {
    notFound();
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
