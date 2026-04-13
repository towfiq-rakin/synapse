import { auth } from "@/lib/auth";
import Note, { type NoteType, type NoteVisibility } from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Types } from "mongoose";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function normalizeTitle(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;

  const title = input.trim().slice(0, 180);
  return title.length > 0 ? title : "Untitled";
}

function normalizeSlug(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;

  const slug = input.trim().toLowerCase();
  if (!slug) return "";

  return /^[a-z0-9-]+$/.test(slug) ? slug : undefined;
}

function normalizeTags(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;

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

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid note id" }, { status: 400 });
  }

  await connectToDatabase();

  const note = await Note.findOne({ _id: id, userId }).lean();

  if (!note) {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }

  return Response.json({ note });
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid note id" }, { status: 400 });
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: {
    title?: string;
    content?: string;
    contentText?: string;
    slug?: string | undefined;
    type?: NoteType;
    visibility?: NoteVisibility;
    tags?: string[];
  } = {};

  const title = normalizeTitle(body.title);
  if (title !== undefined) updates.title = title;

  if (typeof body.content === "string") {
    updates.content = body.content;
  }

  if (typeof body.contentText === "string") {
    updates.contentText = body.contentText;
  }

  if (body.slug !== undefined) {
    const slug = normalizeSlug(body.slug);
    if (slug === undefined) {
      return Response.json({ error: "Invalid slug format" }, { status: 400 });
    }
    updates.slug = slug || undefined;
  }

  if (body.type !== undefined) {
    if (!isNoteType(body.type)) {
      return Response.json({ error: "Invalid note type" }, { status: 400 });
    }
    updates.type = body.type;
  }

  if (body.visibility !== undefined) {
    if (!isVisibility(body.visibility)) {
      return Response.json({ error: "Invalid visibility" }, { status: 400 });
    }
    updates.visibility = body.visibility;
  }

  if (body.tags !== undefined) {
    const tags = normalizeTags(body.tags);
    if (tags === undefined) {
      return Response.json({ error: "Invalid tags format" }, { status: 400 });
    }
    updates.tags = tags;
  }

  await connectToDatabase();

  try {
    const note = await Note.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    return Response.json({ note });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return Response.json({ error: "A note with this slug already exists." }, { status: 409 });
    }

    return Response.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid note id" }, { status: 400 });
  }

  await connectToDatabase();

  const result = await Note.deleteOne({ _id: id, userId });

  if (!result.deletedCount) {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
