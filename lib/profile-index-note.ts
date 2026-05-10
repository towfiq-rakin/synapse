import Note from "@/lib/db/models/Note";
import { buildPublishedSnapshot } from "@/lib/publishing/note";

export const PROFILE_INDEX_NOTE_TITLE = "Introduction";
export const PROFILE_INDEX_NOTE_SLUG = "index";
export const PROFILE_INDEX_NOTE_CONTENT = `# Welcome

This is your public workspace introduction.

- Edit this note to customize what visitors see at \`/u/your-username\`.
- This note stays hidden from the public explorer.
- Keep the slug as \`index\` if you want it to remain your profile landing page.
`;

type ProfileIndexNoteSummary = {
  _id: { toString(): string } | string;
  title: string;
  slug?: string;
  folderId: { toString(): string } | string | null;
  updatedAt?: Date;
};

export async function findProfileIndexNote(userId: string) {
  return Note.findOne({
    userId,
    type: "note",
    folderId: null,
    slug: PROFILE_INDEX_NOTE_SLUG,
  })
    .select("_id title slug folderId updatedAt")
    .lean<ProfileIndexNoteSummary | null>();
}

export async function ensureProfileIndexNote(userId: string) {
  const existing = await findProfileIndexNote(userId);

  if (existing) {
    return existing;
  }

  const created = await Note.create({
    userId,
    title: PROFILE_INDEX_NOTE_TITLE,
    slug: PROFILE_INDEX_NOTE_SLUG,
    folderId: null,
    content: PROFILE_INDEX_NOTE_CONTENT,
    contentText: PROFILE_INDEX_NOTE_CONTENT,
    type: "note",
    visibility: "private",
    tags: ["intro"],
  });

  return {
    _id: created._id.toString(),
    title: created.title,
    slug: created.slug,
    folderId: created.folderId,
    updatedAt: created.updatedAt,
  };
}

type PublishableProfileIndexNote = {
  _id: { toString(): string } | string;
  userId: { toString(): string } | string;
  title: string;
  slug?: string;
  folderId: { toString(): string } | string | null;
  content: string;
  contentText: string;
  visibility?: unknown;
  shareId: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export async function ensurePublishedProfileIndexNote(userId: string) {
  const existing = await Note.findOne({
    userId,
    type: "note",
    folderId: null,
    slug: PROFILE_INDEX_NOTE_SLUG,
  })
    .select("_id userId title slug folderId content contentText visibility shareId publishedAt updatedAt")
    .lean<PublishableProfileIndexNote | null>();

  if (!existing) {
    const created = await Note.create({
      userId,
      title: PROFILE_INDEX_NOTE_TITLE,
      slug: PROFILE_INDEX_NOTE_SLUG,
      folderId: null,
      content: PROFILE_INDEX_NOTE_CONTENT,
      contentText: PROFILE_INDEX_NOTE_CONTENT,
      type: "note",
      tags: ["intro"],
      ...(await buildPublishedSnapshot(
        {
          title: PROFILE_INDEX_NOTE_TITLE,
          content: PROFILE_INDEX_NOTE_CONTENT,
          contentText: PROFILE_INDEX_NOTE_CONTENT,
          shareId: null,
          publishedAt: null,
        },
        "published",
        null,
      )),
    });

    return {
      _id: created._id.toString(),
      title: created.title,
      slug: created.slug,
      folderId: created.folderId,
      updatedAt: created.updatedAt,
    };
  }

  if (existing.visibility === "published") {
    return {
      _id: typeof existing._id === "string" ? existing._id : existing._id.toString(),
      title: existing.title,
      slug: existing.slug,
      folderId: existing.folderId,
      updatedAt: existing.updatedAt,
    };
  }

  const updated = await Note.findByIdAndUpdate(
    existing._id,
    {
      $set: await buildPublishedSnapshot(existing, "published", existing.shareId ?? null),
    },
    { new: true, runValidators: true },
  )
    .select("_id title slug folderId updatedAt")
    .lean<ProfileIndexNoteSummary | null>();

  if (updated) {
    return updated;
  }

  return {
    _id: typeof existing._id === "string" ? existing._id : existing._id.toString(),
    title: existing.title,
    slug: existing.slug,
    folderId: existing.folderId,
    updatedAt: existing.updatedAt,
  };
}
