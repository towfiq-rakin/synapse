import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import { LAST_OPENED_NOTE_COOKIE } from "@/lib/note-selection";
import { generateUniqueSlug } from "@/lib/notes-path";

const WELCOME_NOTE_TITLE = "Welcome to Synapse";
const WELCOME_NOTE_CONTENT = `# Welcome to Synapse

This workspace is ready to use.

- Rename this note or delete it when you want a clean slate.
- Create folders from the sidebar to organize topics.
- Everything you write here auto-syncs as you edit.
`;

async function createWelcomeNote(userId: string) {
  const slug = await generateUniqueSlug(WELCOME_NOTE_TITLE, async (candidate) => {
    const existing = await Note.exists({ userId, folderId: null, slug: candidate });
    return Boolean(existing);
  });

  return Note.create({
    userId,
    title: WELCOME_NOTE_TITLE,
    slug,
    folderId: null,
    content: WELCOME_NOTE_CONTENT,
    contentText: WELCOME_NOTE_CONTENT,
    type: "note",
    visibility: "private",
    tags: ["welcome"],
  });
}

export default async function NotesPage() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect("/login");
  }

  await connectToDatabase();

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
    const latestId = typeof latest._id === "string" ? latest._id : latest._id.toString();
    redirect(`/notes/${latestId}`);
  }

  const welcomeNote = await createWelcomeNote(userId);
  redirect(`/notes/${welcomeNote._id.toString()}`);
}
