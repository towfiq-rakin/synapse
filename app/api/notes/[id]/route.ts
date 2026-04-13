import { auth } from "@/lib/auth";
import Folder from "@/lib/db/models/Folder";
import Note, { type NoteType, type NoteVisibility } from "@/lib/db/models/Note";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  buildFolderSegmentsById,
  buildPrivateNoteHref,
  generateUniqueSlug,
  parseFrontmatterTitle,
  slugFromText,
  type FolderPathNode,
  type NotePathNode,
} from "@/lib/notes-path";
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

function normalizeFolderId(value: unknown): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : (value as { toString(): string }).toString();
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
    folderId?: string | null;
    slug?: string | undefined;
    type?: NoteType;
    visibility?: NoteVisibility;
    tags?: string[];
  } = {};

  let nextFolderId: string | null | undefined;
  let explicitSlug = false;

  const title = normalizeTitle(body.title);
  if (title !== undefined) updates.title = title;

  if (typeof body.content === "string") {
    updates.content = body.content;
  }

  if (typeof body.contentText === "string") {
    updates.contentText = body.contentText;
  }

  if (body.folderId !== undefined) {
    if (body.folderId === null || body.folderId === "") {
      nextFolderId = null;
    } else if (typeof body.folderId === "string" && Types.ObjectId.isValid(body.folderId)) {
      nextFolderId = body.folderId;
    } else {
      return Response.json({ error: "Invalid folder id" }, { status: 400 });
    }
  }

  if (body.slug !== undefined) {
    const slug = normalizeSlug(body.slug);
    if (slug === undefined) {
      return Response.json({ error: "Invalid slug format" }, { status: 400 });
    }
    updates.slug = slug || undefined;
    explicitSlug = true;
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

  const current = await Note.findOne({ _id: id, userId }).select("title folderId slug contentText").lean<{
    title: string;
    folderId: { toString(): string } | string | null;
    slug?: string;
    contentText: string;
  } | null>();

  if (!current) {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }

  if (nextFolderId) {
    const folderExists = await Folder.exists({ _id: nextFolderId, userId });

    if (!folderExists) {
      return Response.json({ error: "Folder not found" }, { status: 400 });
    }
  }

  if (nextFolderId !== undefined) {
    updates.folderId = nextFolderId;
  }

  const effectiveContentText = typeof updates.contentText === "string" ? updates.contentText : current.contentText;
  const frontmatterTitle = parseFrontmatterTitle(effectiveContentText);
  const effectiveTitle =
    normalizeTitle(frontmatterTitle ?? updates.title ?? current.title) ??
    current.title;

  updates.title = effectiveTitle;

  if (!explicitSlug || nextFolderId !== undefined || updates.title !== undefined) {
    const effectiveFolderId = normalizeFolderId(
      nextFolderId !== undefined ? nextFolderId : current.folderId,
    );

    const slug = explicitSlug && updates.slug
      ? updates.slug
      : await generateUniqueSlug(effectiveTitle, async (candidate) => {
          const existing = await Note.exists({
            _id: { $ne: id },
            userId,
            folderId: effectiveFolderId,
            slug: candidate,
          });
          return Boolean(existing);
        });

    updates.slug = slug || slugFromText(effectiveTitle);
  }

  try {
    const note = await Note.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const folders = await Folder.find({ userId }).select("_id slug parentId").lean<FolderPathNode[]>();
    const privatePath = buildPrivateNoteHref(note as NotePathNode, buildFolderSegmentsById(folders));

    return Response.json({ note, privatePath });
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
