import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import User from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongoose";
import { normalizePublicProfile } from "@/lib/publishing/profile";

function normalizeOptionalText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export async function PATCH(request: Request) {
  const { userId } = await auth.protect();
  const localUserId = await getAuthenticatedUserId();

  if (!userId || !localUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.isPublicProfile !== "boolean") {
    return Response.json({ error: "Invalid public profile flag" }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findById(localUserId);

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  user.isPublicProfile = body.isPublicProfile;

  if (body.displayName !== undefined) {
    user.displayName = normalizeOptionalText(body.displayName, 120);
  }

  if (body.bio !== undefined) {
    user.bio = normalizeOptionalText(body.bio, 280);
  }

  user.publishedAt = body.isPublicProfile ? user.publishedAt ?? new Date() : null;
  await user.save();

  return Response.json({
    success: true,
    profile: normalizePublicProfile(user.toObject()),
  });
}
