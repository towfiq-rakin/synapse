import { Types } from "mongoose";
import { getAuthenticatedUserId } from "@/lib/auth";
import Note from "@/lib/db/models/Note";
import User from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  buildPublishedSnapshot,
  clearPublishedFields,
  generateUniqueShareId,
  normalizeNoteForResponse,
} from "@/lib/publishing/note";
import { buildNoteShareState } from "@/lib/publishing/public-links";
import { normalizePublicProfile } from "@/lib/publishing/profile";
import { NOTE_VISIBILITIES, type NoteVisibility } from "@/lib/publishing/visibility";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PublishBody = {
  visibility?: unknown;
};

type PublishableNote = {
  _id: { toString(): string } | string;
  userId: { toString(): string } | string;
  fileName?: string;
  title: string;
  slug?: string;
  folderId: { toString(): string } | string | null;
  content: string;
  contentText: string;
  visibility?: unknown;
  shareId: string | null;
  publishedAt: Date | null;
};

function isPublishVisibility(value: unknown): value is NoteVisibility {
  return NOTE_VISIBILITIES.some((item) => item === value);
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

  let body: PublishBody;

  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isPublishVisibility(body.visibility)) {
    return Response.json({ error: "Invalid visibility" }, { status: 400 });
  }

  await connectToDatabase();

  const [note, owner] = await Promise.all([
    Note.findOne({ _id: id, userId })
      .select("_id userId fileName title slug folderId content contentText visibility shareId publishedAt")
      .lean<PublishableNote | null>(),
    User.findById(userId)
      .select("username name displayName bio isPublicProfile publishedAt")
      .lean<{
        username: string;
        name: string;
        displayName?: string;
        bio: string;
        isPublicProfile?: boolean;
        publishedAt?: Date | null;
      } | null>(),
  ]);

  if (!note) {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }

  if (!owner) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const targetVisibility = body.visibility;
  const profile = normalizePublicProfile(owner);

  if (targetVisibility === "private") {
    const updated = await Note.findOneAndUpdate(
      { _id: id, userId },
      { $set: { visibility: "private", ...clearPublishedFields() } },
      { new: true, runValidators: true },
    ).lean();

    const share = updated
      ? await buildNoteShareState(updated, {
          username: owner.username,
          isPublicProfile: owner.isPublicProfile,
        })
      : null;

    return Response.json({
      success: true,
      visibility: "private",
      shareId: null,
      publicUrl: null,
      share,
      note: updated ? normalizeNoteForResponse(updated) : null,
    });
  }

  let updated = null;
  let shareId = targetVisibility === "unlisted" ? note.shareId : note.shareId ?? null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (targetVisibility === "unlisted" && !shareId) {
      shareId = await generateUniqueShareId(async (candidate) => Boolean(await Note.exists({ shareId: candidate })));
    }

    try {
      updated = await Note.findOneAndUpdate(
        { _id: id, userId },
        {
          $set: await buildPublishedSnapshot(
            {
              ...note,
              title: note.title?.trim() || note.fileName?.trim() || "Untitled",
            },
            targetVisibility,
            targetVisibility === "unlisted" ? shareId : shareId ?? null,
          ),
        },
        { new: true, runValidators: true },
      ).lean();
      break;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000 &&
        targetVisibility === "unlisted"
      ) {
        shareId = null;
        continue;
      }

      throw error;
    }
  }

  if (!updated) {
    return Response.json({ error: "Failed to publish note" }, { status: 500 });
  }

  const share = await buildNoteShareState(updated as PublishableNote, {
    username: owner.username,
    isPublicProfile: owner.isPublicProfile,
  });

  const publicUrl =
    targetVisibility === "unlisted"
      ? `/share/${shareId}`
      : profile.isPublicProfile
        ? share.publishedUrl
        : null;

  return Response.json({
    success: true,
    visibility: targetVisibility,
    shareId: targetVisibility === "unlisted" ? shareId : shareId ?? null,
    publicUrl,
    share,
    note: normalizeNoteForResponse(updated),
  });
}
