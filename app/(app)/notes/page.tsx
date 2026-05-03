import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Button } from "@/components/ui/button";
import { createQuickNoteAction } from "./actions";

export default async function NotesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  const latest = await Note.findOne({ userId: session.user.id })
    .sort({ updatedAt: -1 })
    .select("_id")
    .lean<{ _id: { toString(): string } | string } | null>();

  if (latest) {
    const latestId = typeof latest._id === "string" ? latest._id : latest._id.toString();
    redirect(`/notes/${latestId}`);
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
