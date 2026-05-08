export const NOTE_VISIBILITIES = ["private", "unlisted", "published"] as const;

export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number];
export type StoredNoteVisibility = NoteVisibility | "public";

type NoteVisibilityLike = {
  visibility?: unknown;
};

export function normalizeNoteVisibility(value: unknown): NoteVisibility {
  if (value === "unlisted") {
    return "unlisted";
  }

  if (value === "published" || value === "public") {
    return "published";
  }

  return "private";
}

export function isUnlistedNote(note: NoteVisibilityLike): boolean {
  return normalizeNoteVisibility(note.visibility) === "unlisted";
}

export function isPublishedProfileNote(note: NoteVisibilityLike): boolean {
  return normalizeNoteVisibility(note.visibility) === "published";
}

export function isPubliclyReadableNote(
  note: NoteVisibilityLike,
  options: { isPublicProfile?: boolean } = {},
): boolean {
  if (isUnlistedNote(note)) {
    return true;
  }

  if (isPublishedProfileNote(note)) {
    return Boolean(options.isPublicProfile);
  }

  return false;
}
