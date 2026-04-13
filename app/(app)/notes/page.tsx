import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";

type NoteListItem = {
  _id: { toString(): string } | string;
  title: string;
  type: "note" | "blog";
  visibility: "private" | "public";
  updatedAt: Date;
};

export default async function NotesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();

  const notes = await Note.find({ userId: session.user.id })
    .sort({ updatedAt: -1 })
    .select("_id title type visibility updatedAt")
    .lean<NoteListItem[]>();

  return (
    <section className="rounded-xl border bg-card p-4 text-card-foreground sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">My notes</h2>
        <span className="text-sm text-muted-foreground">{notes.length} total</span>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You do not have any notes yet. Create one by sending a POST request to /api/notes.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => {
            const id = typeof note._id === "string" ? note._id : note._id.toString();
            return (
              <li key={id} className="rounded-md border px-3 py-2">
                <Link href={`/app/notes/${id}`} className="font-medium text-foreground hover:underline">
                  {note.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {note.type} • {note.visibility}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
