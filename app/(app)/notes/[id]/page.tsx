import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import Folder from "@/lib/db/models/Folder";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import { buildFolderSegmentsById, buildPrivateNoteHref, type FolderPathNode, type NotePathNode } from "@/lib/notes-path";

type NotePageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyNoteIdRedirectPage({ params }: NotePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectToDatabase();

  const [folders, note] = await Promise.all([
    Folder.find({ userId: session.user.id }).select("_id slug parentId").lean<FolderPathNode[]>(),
    Note.findOne({ _id: id, userId: session.user.id })
      .select("_id title slug folderId")
      .lean<NotePathNode | null>(),
  ]);

  if (!note) {
    notFound();
  }

  redirect(buildPrivateNoteHref(note, buildFolderSegmentsById(folders)));
}
