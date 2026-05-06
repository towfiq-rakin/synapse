import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import User from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongoose";
import { slugFromText } from "@/lib/notes-path";

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

function buildDisplayName(user: ClerkUser): string {
  return (
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress.split("@")[0] ||
    "Synapse User"
  );
}

function buildBaseUsername(user: ClerkUser): string {
  const fallback = `user-${user.id.slice(-8).toLowerCase()}`;
  const candidate =
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress.split("@")[0] ||
    buildDisplayName(user);

  const normalized = slugFromText(candidate, fallback).slice(0, 32);
  return normalized.length >= 3 ? normalized : fallback;
}

async function generateUniqueUsername(base: string, excludeId?: string): Promise<string> {
  const seed = base.slice(0, 32);
  let candidate = seed;
  let suffix = 2;

  while (
    await User.exists({
      username: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    const suffixText = `-${suffix}`;
    const prefix = seed.slice(0, Math.max(3, 32 - suffixText.length));
    candidate = `${prefix}${suffixText}`;
    suffix += 1;
  }

  return candidate;
}

async function ensureLocalUserRecord(user: ClerkUser) {
  await connectToDatabase();

  const email = user.primaryEmailAddress?.emailAddress.toLowerCase() || `${user.id.toLowerCase()}@users.clerk.local`;
  const name = buildDisplayName(user);
  const avatarUrl = user.imageUrl ?? "";

  let localUser =
    (await User.findOne({ clerkId: user.id })) ||
    (await User.findOne({ email }));

  if (!localUser) {
    const username = await generateUniqueUsername(buildBaseUsername(user));
    localUser = await User.create({
      clerkId: user.id,
      email,
      username,
      name,
      avatarUrl,
    });

    return localUser;
  }

  const updates: Record<string, unknown> = {};

  if (!localUser.clerkId) {
    updates.clerkId = user.id;
  }

  if (localUser.email !== email) {
    updates.email = email;
  }

  if (localUser.name !== name) {
    updates.name = name;
  }

  if ((localUser.avatarUrl ?? "") !== avatarUrl) {
    updates.avatarUrl = avatarUrl;
  }

  const preferredUsername = user.username?.trim();
  if (preferredUsername) {
    const normalizedPreferredUsername = slugFromText(preferredUsername, buildBaseUsername(user)).slice(0, 32);

    if (normalizedPreferredUsername.length >= 3 && localUser.username !== normalizedPreferredUsername) {
      updates.username = await generateUniqueUsername(normalizedPreferredUsername, localUser._id.toString());
    }
  } else if (!localUser.username) {
    updates.username = await generateUniqueUsername(buildBaseUsername(user), localUser._id.toString());
  }

  if (Object.keys(updates).length > 0) {
    localUser.set(updates);
    await localUser.save();
  }

  return localUser;
}

/**
 * Returns the app-local user ID that owns notes/folders.
 * The local record is lazily created and linked to the Clerk user on first use.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const { userId } = await clerkAuth();

  if (!userId) {
    return null;
  }

  await connectToDatabase();

  const existing = await User.findOne({ clerkId: userId }).select("_id").lean<{ _id: { toString(): string } } | null>();

  if (existing) {
    return existing._id.toString();
  }

  const user = await currentUser();

  if (!user) {
    return null;
  }

  const localUser = await ensureLocalUserRecord(user);
  return localUser._id.toString();
}

/**
 * Returns the current signed-in user with the app-local ID and synced profile information.
 */
export async function getSessionUser() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const localUser = await ensureLocalUserRecord(user);

  return {
    id: localUser._id.toString(),
    name: localUser.name,
    email: localUser.email,
    image: localUser.avatarUrl || user.imageUrl || null,
    username: localUser.username,
  };
}
