import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import Link from "next/link";
import { auth } from "@/lib/auth";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteNoteAction, updateNoteAction } from "../actions";

type NotePageProps = {
  params: Promise<{ id: string }>;
};

type NoteDetail = {
  _id: { toString(): string } | string;
  title: string;
  content: string;
  type: "note" | "blog";
  visibility: "private" | "public";
  tags: string[];
  updatedAt: Date;
};

export default async function NotePage({ params }: NotePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectToDatabase();

  const note = await Note.findOne({ _id: id, userId: session.user.id }).lean<NoteDetail | null>();

  if (!note) {
    notFound();
  }

  const updateAction = updateNoteAction.bind(null, id);
  const deleteAction = deleteNoteAction.bind(null, id);
  const tagsValue = note.tags.join(", ");
  const updatedAt = new Date(note.updatedAt).toLocaleString();

  return (
    <article className="rounded-xl border bg-card p-4 text-card-foreground sm:p-6">
      <header className="mb-4 space-y-2">
        <Link href="/app/notes" className="text-sm text-muted-foreground hover:underline">
          Back to notes
        </Link>
        <h2 className="text-2xl font-semibold">{note.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{note.type}</Badge>
          <Badge variant="outline">{note.visibility}</Badge>
          <span className="text-xs text-muted-foreground">Updated {updatedAt}</span>
        </div>
      </header>

      <form action={updateAction} className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="title" className="text-sm font-medium text-foreground">
            Title
          </label>
          <Input id="title" name="title" defaultValue={note.title} required maxLength={180} />
        </div>

        <div className="grid gap-2">
          <label htmlFor="content" className="text-sm font-medium text-foreground">
            Content
          </label>
          <Textarea id="content" name="content" defaultValue={note.content} rows={14} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="type" className="text-sm font-medium text-foreground">
              Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={note.type}
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
              defaultValue={note.visibility}
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
          <Input id="tags" name="tags" defaultValue={tagsValue} placeholder="ideas, roadmap, meeting" />
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="submit">Save changes</Button>
        </div>
      </form>

      <form action={deleteAction} className="mt-6 border-t pt-4">
        <Button type="submit" variant="destructive">
          Delete note
        </Button>
      </form>
    </article>
  );
}
