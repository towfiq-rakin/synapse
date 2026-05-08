import { getAuthenticatedUserId } from "@/lib/auth";
import Note from "@/lib/db/models/Note";
import User from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getExplorerPayload, resolveFolderIdFromBody } from "@/lib/explorer";
import {
  generateUniqueSlug,
  parseFrontmatterTitle,
  slugFromText,
} from "@/lib/notes-path";
import { Types } from "mongoose";
import {
  buildPublishedSnapshot,
  generateUniqueShareId,
  normalizeNoteForResponse,
} from "@/lib/publishing/note";
import { buildNoteShareState } from "@/lib/publishing/public-links";
import { normalizeNoteVisibility } from "@/lib/publishing/visibility";

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

  const [note, owner] = await Promise.all([
    Note.findOne({ _id: id, userId }).lean(),
    User.findById(userId).select("username isPublicProfile").lean<{ username: string; isPublicProfile?: boolean | null } | null>(),
  ]);

  if (!note) {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }

  if (!owner) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const explorer = await getExplorerPayload(userId);
  const href = `/notes/${id}`;
  const share = await buildNoteShareState(note, owner);

  return Response.json({ note: normalizeNoteForResponse(note), href, privatePath: href, explorer, share });
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
    visibility?: "private" | "unlisted" | "published";
    shareId?: string | null;
    publicHtml?: string | null;
    publicMarkdown?: string | null;
    publicToc?: { id: string; text: string; level: number }[] | null;
    publishedAt?: Date | null;
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

  if (body.slug !== undefined) {
    const slug = normalizeSlug(body.slug);
    if (slug === undefined) {
      return Response.json({ error: "Invalid slug format" }, { status: 400 });
    }
    updates.slug = slug || undefined;
    explicitSlug = true;
  }

  if (body.tags !== undefined) {
    const tags = normalizeTags(body.tags);
    if (tags === undefined) {
      return Response.json({ error: "Invalid tags format" }, { status: 400 });
    }
    updates.tags = tags;
  }

  await connectToDatabase();

  if (body.folderId !== undefined || body.folderPath !== undefined) {
    const resolvedFolderId = await resolveFolderIdFromBody(userId, body);

    if (resolvedFolderId === undefined) {
      return Response.json({ error: "Folder not found" }, { status: 404 });
    }

    nextFolderId = resolvedFolderId;
  }

  const current = await Note.findOne({ _id: id, userId }).select(
    "title folderId slug content contentText visibility shareId publishedAt",
  ).lean<{
    title: string;
    folderId: { toString(): string } | string | null;
    slug?: string;
    content: string;
    contentText: string;
    visibility?: unknown;
    shareId: string | null;
    publishedAt: Date | null;
  } | null>();

  if (!current) {
    return Response.json({ error: "Note not found" }, { status: 404 });
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

  const effectiveVisibility = normalizeNoteVisibility(current.visibility);
  const effectiveContent = typeof updates.content === "string" ? updates.content : current.content;
  const shouldRefreshSnapshot = effectiveVisibility === "unlisted" || effectiveVisibility === "published";

  if (shouldRefreshSnapshot) {
    const shareId =
      effectiveVisibility === "unlisted"
        ? current.shareId ?? (await generateUniqueShareId(async (candidate) => Boolean(await Note.exists({ shareId: candidate }))))
        : current.shareId ?? null;

    Object.assign(
      updates,
      await buildPublishedSnapshot(
        {
          title: effectiveTitle,
          content: effectiveContent,
          contentText: effectiveContentText,
          visibility: effectiveVisibility,
          shareId: current.shareId,
          publishedAt: current.publishedAt,
        },
        effectiveVisibility,
        shareId,
      ),
    );
  } else if (effectiveVisibility !== "private" && current.visibility === "public") {
    updates.visibility = effectiveVisibility;
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

    const explorer = await getExplorerPayload(userId);
    const href = `/notes/${id}`;

    return Response.json({ note: normalizeNoteForResponse(note), href, privatePath: href, explorer });
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
