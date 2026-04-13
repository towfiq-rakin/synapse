import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";

type NotePageProps = {
  params: Promise<{ id: string }>;
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

  const note = await Note.findOne({ _id: id, userId: session.user.id }).lean();

  if (!note) {
    notFound();
  }

  return (
    <article className="rounded-xl border bg-card p-4 text-card-foreground sm:p-6">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold">{note.title}</h2>
        <p className="text-sm text-muted-foreground">
          {note.type} • {note.visibility}
        </p>
      </header>

      <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
        {note.content || "(empty note)"}
      </pre>
    </article>
  );
}
