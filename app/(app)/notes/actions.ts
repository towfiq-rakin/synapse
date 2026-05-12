"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth";
import Folder from "@/lib/db/models/Folder";
import Note from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  generateUniqueSlug,
  parseFrontmatterTitle,
} from "@/lib/notes-path";
import { buildPublishedSnapshot, generateUniqueShareId } from "@/lib/publishing/note";
import { normalizeNoteVisibility } from "@/lib/publishing/visibility";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function normalizeFileName(input: string): string {
  const fileName = input.trim().slice(0, 180);
  return fileName || "Untitled";
}

function normalizeTitle(input: string): string {
  return input.trim().slice(0, 180);
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
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect("/login");
  }

  return userId;
}

export async function createNoteAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const fileName = normalizeFileName(readString(formData, "fileName") || readString(formData, "title"));
  const content = readString(formData, "content");
  const tags = normalizeTags(readString(formData, "tags"));

  await connectToDatabase();

  const folderId = await resolveFolderId(userId, readString(formData, "folderId"));
  const frontmatterTitle = parseFrontmatterTitle(content);
  const resolvedTitle = normalizeTitle(frontmatterTitle ?? "");
  const slug = await generateUniqueSlug(fileName, async (candidate) => {
    const existing = await Note.exists({ userId, folderId, slug: candidate });
    return Boolean(existing);
  });

  const created = await Note.create({
    userId,
    fileName,
    title: resolvedTitle,
    slug,
    folderId,
    content,
    contentText: content,
    type: "note",
    visibility: "private",
    tags,
  });

  revalidatePath("/");
  revalidatePath("/notes");
  redirect(`/notes/${created._id.toString()}`);
}

export async function updateNoteAction(noteId: string, formData: FormData): Promise<void> {
  const userId = await requireUserId();

  if (!Types.ObjectId.isValid(noteId)) {
    redirect("/notes");
  }

  const fileName = normalizeFileName(readString(formData, "fileName") || readString(formData, "title"));
  const content = readString(formData, "content");
  const tags = normalizeTags(readString(formData, "tags"));

  await connectToDatabase();

  const folderId = await resolveFolderId(userId, readString(formData, "folderId"));
  const frontmatterTitle = parseFrontmatterTitle(content);
  const resolvedTitle = normalizeTitle(frontmatterTitle ?? "");

  const slug = await generateUniqueSlug(fileName, async (candidate) => {
    const existing = await Note.exists({
      _id: { $ne: noteId },
      userId,
      folderId,
      slug: candidate,
    });
    return Boolean(existing);
  });

  const current = await Note.findOne({ _id: noteId, userId })
    .select("visibility shareId publishedAt")
    .lean<{
      visibility?: unknown;
      shareId: string | null;
      publishedAt: Date | null;
    } | null>();

  if (!current) {
    redirect("/notes");
  }

  const normalizedVisibility = normalizeNoteVisibility(current.visibility);
  const updates: Record<string, unknown> = {
    fileName,
    title: resolvedTitle,
    slug,
    folderId,
    content,
    contentText: content,
    type: "note",
    tags,
  };

  if (normalizedVisibility === "unlisted" || normalizedVisibility === "published") {
    const shareId =
      normalizedVisibility === "unlisted"
        ? current.shareId ?? (await generateUniqueShareId(async (candidate) => Boolean(await Note.exists({ shareId: candidate }))))
        : current.shareId ?? null;

    Object.assign(
      updates,
      await buildPublishedSnapshot(
        {
          title: resolvedTitle || fileName,
          content,
          contentText: content,
          visibility: normalizedVisibility,
          shareId: current.shareId,
          publishedAt: current.publishedAt,
        },
        normalizedVisibility,
        shareId,
      ),
    );
  } else if (current.visibility === "public") {
    updates.visibility = "published";
  }

  const updated = await Note.findOneAndUpdate(
    { _id: noteId, userId },
    {
      $set: updates,
    },
    { new: true },
  ).lean();

  if (!updated) {
    redirect("/notes");
  }

  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath(`/notes/${updated._id.toString()}`);
  redirect(`/notes/${updated._id.toString()}`);
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
  const fileName = "Untitled";
  const slug = await generateUniqueSlug(fileName, async (candidate) => {
    const existing = await Note.exists({ userId, folderId, slug: candidate });
    return Boolean(existing);
  });

  const created = await Note.create({
    userId,
    fileName,
    title: "",
    slug,
    folderId,
    content: "",
    contentText: "",
    type: "note",
    visibility: "private",
    tags: [],
  });

  revalidatePath("/");
  revalidatePath("/notes");
  redirect(`/notes/${created._id.toString()}`);
}
