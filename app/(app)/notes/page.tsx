import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createNoteAction, deleteNoteAction } from "./actions";

type NoteListItem = {
  _id: { toString(): string } | string;
  title: string;
  type: "note" | "blog";
  visibility: "private" | "public";
  tags: string[];
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
    .select("_id title type visibility tags updatedAt")
    .lean<NoteListItem[]>();

  return (
    <section className="space-y-6">
      <article className="rounded-xl border bg-card p-4 text-card-foreground sm:p-6">
        <h2 className="text-xl font-semibold">Create note</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create a new note in your private workspace.</p>

        <form action={createNoteAction} className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Title
            </label>
            <Input id="title" name="title" placeholder="Untitled" required />
          </div>

          <div className="grid gap-2">
            <label htmlFor="content" className="text-sm font-medium text-foreground">
              Content
            </label>
            <Textarea id="content" name="content" placeholder="Write your note..." rows={6} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="type" className="text-sm font-medium text-foreground">
                Type
              </label>
              <select
                id="type"
                name="type"
                defaultValue="note"
                className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="note">Note</option>
                <option value="blog">Blog draft</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="visibility" className="text-sm font-medium text-foreground">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                defaultValue="private"
                className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="tags" className="text-sm font-medium text-foreground">
              Tags
            </label>
            <Input id="tags" name="tags" placeholder="ideas, roadmap, meeting" />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Create note</Button>
          </div>
        </form>
      </article>

      <article className="rounded-xl border bg-card p-4 text-card-foreground sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">My notes</h2>
          <span className="text-sm text-muted-foreground">{notes.length} total</span>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet. Create your first note above.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => {
              const id = typeof note._id === "string" ? note._id : note._id.toString();
              const deleteAction = deleteNoteAction.bind(null, id);
              const updatedAt = new Date(note.updatedAt).toLocaleString();

              return (
                <li key={id} className="rounded-md border px-3 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <Link href={`/app/notes/${id}`} className="font-medium text-foreground hover:underline">
                        {note.title || "Untitled"}
                      </Link>
                      <p className="text-xs text-muted-foreground">Updated {updatedAt}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{note.type}</Badge>
                        <Badge variant="outline">{note.visibility}</Badge>
                        {note.tags.map((tag) => (
                          <Badge key={tag} variant="ghost">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/app/notes/${id}`}>Open</Link>
                      </Button>
                      <form action={deleteAction}>
                        <Button type="submit" variant="destructive" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </section>
  );
}
