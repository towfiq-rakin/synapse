import Asset from "@/lib/db/models/Asset";
import { getAuthenticatedUserId } from "@/lib/auth";
import {
  coercePositiveInteger,
  findOwnedNote,
  isValidNoteId,
  normalizeOriginalFilename,
} from "@/lib/assets/note-assets";
import { connectToDatabase } from "@/lib/db/mongoose";

type CreateAssetBody = {
  noteId?: unknown;
  provider?: unknown;
  publicId?: unknown;
  secureUrl?: unknown;
  width?: unknown;
  height?: unknown;
  bytes?: unknown;
  format?: unknown;
  originalFilename?: unknown;
};

type LeanAsset = {
  _id: { toString(): string } | string;
  publicId: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  originalFilename: string | null;
};

function normalizeFormat(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed.slice(0, 40) : null;
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateAssetBody;

  try {
    body = (await request.json()) as CreateAssetBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidNoteId(body.noteId)) {
    return Response.json({ error: "Invalid note id" }, { status: 400 });
  }

  if (body.provider !== "cloudinary") {
    return Response.json({ error: "Unsupported asset provider" }, { status: 400 });
  }

  if (typeof body.publicId !== "string" || body.publicId.trim().length === 0) {
    return Response.json({ error: "Missing Cloudinary public id" }, { status: 400 });
  }

  if (typeof body.secureUrl !== "string" || body.secureUrl.trim().length === 0) {
    return Response.json({ error: "Missing asset URL" }, { status: 400 });
  }

  await connectToDatabase();

  const note = await findOwnedNote(body.noteId, userId);

  if (!note) {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }

  const asset = await Asset.findOneAndUpdate(
    {
      provider: "cloudinary",
      publicId: body.publicId.trim(),
    },
    {
      $set: {
        userId,
        noteId: body.noteId,
        provider: "cloudinary",
        publicId: body.publicId.trim(),
        secureUrl: body.secureUrl.trim(),
        width: coercePositiveInteger(body.width),
        height: coercePositiveInteger(body.height),
        bytes: coercePositiveInteger(body.bytes),
        format: normalizeFormat(body.format),
        originalFilename: normalizeOriginalFilename(body.originalFilename),
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  ).lean<LeanAsset>();

  return Response.json({
    asset: {
      id: typeof asset._id === "string" ? asset._id : asset._id.toString(),
      publicId: asset.publicId,
      secureUrl: asset.secureUrl,
      width: asset.width,
      height: asset.height,
      bytes: asset.bytes,
      format: asset.format,
      originalFilename: asset.originalFilename,
    },
  });
}
