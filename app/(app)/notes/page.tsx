import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Folder from "@/lib/db/models/Folder";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Button } from "@/components/ui/button";
import { createQuickNoteAction } from "./actions";
import { getExplorerUser } from "@/lib/explorer";
import { buildFolderSegmentsById, buildUserNoteHref, type FolderPathNode, type NotePathNode } from "@/lib/notes-path";

export default async function NotesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  const [folders, latest] = await Promise.all([
    Folder.find({ userId: session.user.id }).select("_id slug parentId").lean<FolderPathNode[]>(),
    Note.findOne({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .select("_id title slug folderId")
      .lean<NotePathNode | null>(),
  ]);

  if (latest) {
    const user = await getExplorerUser(session.user.id);
    redirect(user ? buildUserNoteHref(user.username, latest, buildFolderSegmentsById(folders)) : "/");
  }

  return (
    <section className="mx-auto max-w-2xl rounded-xl border bg-card p-6 text-card-foreground">
      <h2 className="text-2xl font-semibold">Start your first note</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The editor opens immediately after creating a note, and all edits are auto-synced.
      </p>

      <form action={createQuickNoteAction} className="mt-6">
        <Button type="submit">Create first note</Button>
      </form>
    </section>
  );
}
