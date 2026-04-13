"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import Note, { type NoteType, type NoteVisibility } from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function normalizeTitle(input: string): string {
  const title = input.trim().slice(0, 180);
  return title || "Untitled";
}

function normalizeType(input: string): NoteType {
  return input === "blog" ? "blog" : "note";
}

function normalizeVisibility(input: string): NoteVisibility {
  return input === "public" ? "public" : "private";
}

function normalizeTags(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 50);
}

async function requireUserId(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

export async function createNoteAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const title = normalizeTitle(readString(formData, "title"));
  const content = readString(formData, "content");
  const type = normalizeType(readString(formData, "type"));
  const visibility = normalizeVisibility(readString(formData, "visibility"));
  const tags = normalizeTags(readString(formData, "tags"));

  await connectToDatabase();

  const created = await Note.create({
    userId,
    title,
    content,
    contentText: content,
    type,
    visibility,
    tags,
  });

  const createdId = created._id.toString();

  revalidatePath("/app/notes");
  redirect(`/app/notes/${createdId}`);
}

export async function updateNoteAction(noteId: string, formData: FormData): Promise<void> {
  const userId = await requireUserId();

  if (!Types.ObjectId.isValid(noteId)) {
    redirect("/app/notes");
  }

  const title = normalizeTitle(readString(formData, "title"));
  const content = readString(formData, "content");
  const type = normalizeType(readString(formData, "type"));
  const visibility = normalizeVisibility(readString(formData, "visibility"));
  const tags = normalizeTags(readString(formData, "tags"));

  await connectToDatabase();

  const updated = await Note.findOneAndUpdate(
    { _id: noteId, userId },
    {
      $set: {
        title,
        content,
        contentText: content,
        type,
        visibility,
        tags,
      },
    },
    { new: true },
  ).lean();

  if (!updated) {
    redirect("/app/notes");
  }

  revalidatePath("/app/notes");
  revalidatePath(`/app/notes/${noteId}`);
  redirect(`/app/notes/${noteId}`);
}

export async function deleteNoteAction(noteId: string, formData: FormData): Promise<void> {
  void formData;
  const userId = await requireUserId();

  if (!Types.ObjectId.isValid(noteId)) {
    redirect("/app/notes");
  }

  await connectToDatabase();
  await Note.deleteOne({ _id: noteId, userId });

  revalidatePath("/app/notes");
  revalidatePath(`/app/notes/${noteId}`);
  redirect("/app/notes");
}
