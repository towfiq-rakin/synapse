import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth";
import AutoSyncNoteEditor from "@/components/editor/auto-sync-note-editor";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";

type NotePageProps = {
  params: Promise<{ id: string }>;
};

type EditorNote = {
  _id: { toString(): string } | string;
  title: string;
  content: string;
  folderId: { toString(): string } | string | null;
};

export default async function NoteEditorPage({ params }: NotePageProps) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect("/login");
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectToDatabase();

  const note = await Note.findOne({ _id: id, userId })
    .select("_id title content folderId")
    .lean<EditorNote | null>();

  if (!note) {
    notFound();
  }

  return (
    <AutoSyncNoteEditor
      key={id}
      noteId={typeof note._id === "string" ? note._id : note._id.toString()}
      initialTitle={note.title || "Untitled"}
      initialContent={note.content || ""}
      initialFolderId={typeof note.folderId === "string" ? note.folderId : note.folderId?.toString() ?? null}
    />
  );
}
