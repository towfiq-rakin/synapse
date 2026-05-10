import { getAuthenticatedUserId } from "@/lib/auth";
import { findOwnedNote, isValidNoteId } from "@/lib/assets/note-assets";
import { buildNoteAssetFolder, getCloudinary, getCloudinaryEnv } from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/db/mongoose";

type SignatureBody = {
  noteId?: unknown;
};

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SignatureBody;

  try {
    body = (await request.json()) as SignatureBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidNoteId(body.noteId)) {
    return Response.json({ error: "Invalid note id" }, { status: 400 });
  }

  await connectToDatabase();

  const note = await findOwnedNote(body.noteId, userId);

  if (!note) {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }

  try {
    const { cloudName, apiKey, apiSecret, uploadPreset } = getCloudinaryEnv();
    const folder = buildNoteAssetFolder(userId, body.noteId);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = getCloudinary().utils.api_sign_request(
      {
        folder,
        timestamp,
        upload_preset: uploadPreset,
      },
      apiSecret,
    );

    return Response.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      uploadPreset,
    });
  } catch (error) {
    console.error("Failed to create Cloudinary signature", error);
    return Response.json({ error: "Cloudinary is not configured." }, { status: 500 });
  }
}
