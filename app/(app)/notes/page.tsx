import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth";
import Note from "@/lib/db/models/Note";
import User from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongoose";
import { LAST_OPENED_NOTE_COOKIE } from "@/lib/note-selection";
import {
  ensureProfileIndexNote,
  ensurePublishedProfileIndexNote,
  findProfileIndexNote,
} from "@/lib/profile-index-note";

export default async function NotesPage() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect("/login");
  }

  await connectToDatabase();

  let hasProfileIndexNote = Boolean(await findProfileIndexNote(userId));
  const owner = await User.findById(userId).select("isPublicProfile").lean<{ isPublicProfile?: boolean } | null>();
  const isPublicProfile = Boolean(owner?.isPublicProfile);

  const cookieStore = await cookies();
  const lastOpenedNoteId = cookieStore.get(LAST_OPENED_NOTE_COOKIE)?.value?.trim();

  if (lastOpenedNoteId && Types.ObjectId.isValid(lastOpenedNoteId)) {
    const lastOpened = await Note.findOne({ _id: lastOpenedNoteId, userId, type: "note" })
      .select("_id")
      .lean<{ _id: { toString(): string } | string } | null>();

    if (lastOpened) {
      const resolvedId = typeof lastOpened._id === "string" ? lastOpened._id : lastOpened._id.toString();
      redirect(`/notes/${resolvedId}`);
    }
  }

  const latest = await Note.findOne({ userId, type: "note" })
    .sort({ updatedAt: -1 })
    .select("_id")
    .lean<{ _id: { toString(): string } | string } | null>();

  if (latest) {
    if (!hasProfileIndexNote) {
      if (isPublicProfile) {
        await ensurePublishedProfileIndexNote(userId);
      } else {
        await ensureProfileIndexNote(userId);
      }

      hasProfileIndexNote = true;
    }

    const latestId = typeof latest._id === "string" ? latest._id : latest._id.toString();
    redirect(`/notes/${latestId}`);
  }

  const introNote = isPublicProfile
    ? await ensurePublishedProfileIndexNote(userId)
    : await ensureProfileIndexNote(userId);
  const introNoteId = typeof introNote._id === "string" ? introNote._id : introNote._id.toString();
  redirect(`/notes/${introNoteId}`);
}
