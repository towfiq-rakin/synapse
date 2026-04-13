"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import Folder from "@/lib/db/models/Folder";
import Note, { type NoteType, type NoteVisibility } from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  buildFolderSegmentsById,
  buildPrivateNoteHref,
  generateUniqueSlug,
  parseFrontmatterTitle,
} from "@/lib/notes-path";

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

function normalizeFolderName(input: string): string {
  return input.trim().slice(0, 120);
}

async function resolveFolderId(userId: string, input: string): Promise<string | null> {
  const folderId = input.trim();

  if (!folderId || !Types.ObjectId.isValid(folderId)) {
    return null;
  }

  const folder = await Folder.exists({ _id: folderId, userId });
  return folder ? folderId : null;
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

  const folderId = await resolveFolderId(userId, readString(formData, "folderId"));
  const frontmatterTitle = parseFrontmatterTitle(content);
  const resolvedTitle = normalizeTitle(frontmatterTitle ?? title);
  const slug = await generateUniqueSlug(resolvedTitle, async (candidate) => {
    const existing = await Note.exists({ userId, folderId, slug: candidate });
    return Boolean(existing);
  });

  const created = await Note.create({
    userId,
    title: resolvedTitle,
    slug,
    folderId,
    content,
    contentText: content,
    type,
    visibility,
    tags,
  });

  const folders = await Folder.find({ userId }).select("_id slug parentId").lean();
  const href = buildPrivateNoteHref(created, buildFolderSegmentsById(folders));

  revalidatePath("/");
  revalidatePath("/notes");
  redirect(href);
}

export async function updateNoteAction(noteId: string, formData: FormData): Promise<void> {
  const userId = await requireUserId();

  if (!Types.ObjectId.isValid(noteId)) {
    redirect("/notes");
  }

  const title = normalizeTitle(readString(formData, "title"));
  const content = readString(formData, "content");
  const type = normalizeType(readString(formData, "type"));
  const visibility = normalizeVisibility(readString(formData, "visibility"));
  const tags = normalizeTags(readString(formData, "tags"));

  await connectToDatabase();

  const folderId = await resolveFolderId(userId, readString(formData, "folderId"));
  const frontmatterTitle = parseFrontmatterTitle(content);
  const resolvedTitle = normalizeTitle(frontmatterTitle ?? title);

  const slug = await generateUniqueSlug(resolvedTitle, async (candidate) => {
    const existing = await Note.exists({
      _id: { $ne: noteId },
      userId,
      folderId,
      slug: candidate,
    });
    return Boolean(existing);
  });

  const updated = await Note.findOneAndUpdate(
    { _id: noteId, userId },
    {
      $set: {
        title: resolvedTitle,
        slug,
        folderId,
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
    redirect("/notes");
  }

  const folders = await Folder.find({ userId }).select("_id slug parentId").lean();
  const href = buildPrivateNoteHref(updated, buildFolderSegmentsById(folders));

  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath(href);
  redirect(href);
}

export async function deleteNoteAction(noteId: string, formData: FormData): Promise<void> {
  void formData;
  const userId = await requireUserId();

  if (!Types.ObjectId.isValid(noteId)) {
    redirect("/notes");
  }

  await connectToDatabase();
  await Note.deleteOne({ _id: noteId, userId });

  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
  redirect("/notes");
}

export async function createFolderAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const folderName = normalizeFolderName(readString(formData, "folderName"));

  if (!folderName) {
    redirect("/notes");
  }

  await connectToDatabase();

  const parentId = await resolveFolderId(userId, readString(formData, "parentId"));

  const slug = await generateUniqueSlug(folderName, async (candidate) => {
    const existing = await Folder.exists({ userId, parentId, slug: candidate });
    return Boolean(existing);
  });

  const lastSibling = await Folder.findOne({ userId, parentId }).sort({ order: -1 }).select("order").lean<{ order: number } | null>();

  await Folder.create({
    userId,
    name: folderName,
    slug,
    parentId,
    order: (lastSibling?.order ?? -1) + 1,
  });

  revalidatePath("/");
  revalidatePath("/notes");
  redirect("/");
}

export async function createQuickNoteAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();

  const parentRaw = readString(formData, "parentId");

  await connectToDatabase();

  const folderId = await resolveFolderId(userId, parentRaw);
  const title = "Untitled";
  const slug = await generateUniqueSlug(title, async (candidate) => {
    const existing = await Note.exists({ userId, folderId, slug: candidate });
    return Boolean(existing);
  });

  const created = await Note.create({
    userId,
    title,
    slug,
    folderId,
    content: "",
    contentText: "",
    type: "note",
    visibility: "private",
    tags: [],
  });

  const folders = await Folder.find({ userId }).select("_id slug parentId").lean();
  const href = buildPrivateNoteHref(created, buildFolderSegmentsById(folders));

  revalidatePath("/");
  revalidatePath("/notes");
  redirect(href);
}
