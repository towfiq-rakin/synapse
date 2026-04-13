import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Folder from "@/lib/db/models/Folder";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  findFolderIdBySegments,
  normalizePathSegments,
  toNullableId,
  type FolderPathNode,
} from "@/lib/notes-path";
import AutoSyncNoteEditor from "@/components/editor/auto-sync-note-editor";

type PrivatePathPageProps = {
  params: Promise<{ notePath: string[] }>;
};

type NoteDetail = {
  _id: { toString(): string } | string;
  title: string;
  folderId: { toString(): string } | string | null;
  content: string;
};

function toId(value: { toString(): string } | string): string {
  return typeof value === "string" ? value : value.toString();
}

export default async function PrivatePathPage({ params }: PrivatePathPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { notePath } = await params;
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

  const folders = await Folder.find({ userId: session.user.id })
    .select("_id slug parentId")
    .lean<FolderPathNode[]>();

  const folderId = findFolderIdBySegments(folders, folderPath);

  if (folderId === undefined) {
    notFound();
  }

  const note = await Note.findOne({
    userId: session.user.id,
    folderId,
    slug: noteSlug,
  })
    .select("_id title folderId content")
    .lean<NoteDetail | null>();

  if (!note) {
    notFound();
  }

  return (
    <AutoSyncNoteEditor
      noteId={toId(note._id)}
      initialTitle={note.title || "Untitled"}
      initialContent={note.content || ""}
      initialFolderId={toNullableId(note.folderId)}
    />
  );
}
