import { auth } from "@/lib/auth";
import Folder from "@/lib/db/models/Folder";
import Note, { type NoteType, type NoteVisibility } from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import { generateUniqueSlug, parseFrontmatterTitle } from "@/lib/notes-path";
import { Types } from "mongoose";

function normalizeText(input: unknown, fallback = ""): string {
  if (typeof input !== "string") return fallback;
  return input.trim();
}

function normalizeSlug(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;

  const slug = input.trim().toLowerCase();
  if (!slug) return undefined;

  return /^[a-z0-9-]+$/.test(slug) ? slug : undefined;
}

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0)
    .slice(0, 50);
}

function isNoteType(value: unknown): value is NoteType {
  return value === "note" || value === "blog";
}

function isVisibility(value: unknown): value is NoteVisibility {
  return value === "private" || value === "public";
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const notes = await Note.find({ userId })
    .sort({ updatedAt: -1 })
    .select("_id title slug type visibility tags updatedAt createdAt")
    .lean();

  return Response.json({ notes });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = normalizeText(body.title, "Untitled").slice(0, 180);
  const content = typeof body.content === "string" ? body.content : "";
  const contentText = typeof body.contentText === "string" ? body.contentText : "";
  const tags = normalizeTags(body.tags);
  const type: NoteType = isNoteType(body.type) ? body.type : "note";
  const visibility: NoteVisibility = isVisibility(body.visibility) ? body.visibility : "private";
  let folderId: string | null = null;

  if (body.folderId !== undefined && body.folderId !== null && body.folderId !== "") {
    if (typeof body.folderId !== "string" || !Types.ObjectId.isValid(body.folderId)) {
      return Response.json({ error: "Invalid folder id" }, { status: 400 });
    }

    folderId = body.folderId;
  }

  await connectToDatabase();

  if (folderId) {
    const folderExists = await Folder.exists({ _id: folderId, userId });

    if (!folderExists) {
      return Response.json({ error: "Folder not found" }, { status: 400 });
    }
  }

  const frontmatterTitle = parseFrontmatterTitle(contentText);
  const resolvedTitle = normalizeText(frontmatterTitle ?? title, "Untitled").slice(0, 180);

  const slug = normalizeSlug(body.slug) ??
    (await generateUniqueSlug(resolvedTitle, async (candidate) => {
      const existing = await Note.exists({ userId, folderId, slug: candidate });
      return Boolean(existing);
    }));

  try {
    const created = await Note.create({
      userId,
      title: resolvedTitle,
      slug,
      folderId,
      content,
      contentText,
      type,
      visibility,
      tags,
    });

    return Response.json({ note: created.toObject() }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return Response.json({ error: "A note with this slug already exists." }, { status: 409 });
    }

    return Response.json({ error: "Failed to create note" }, { status: 500 });
  }
}
