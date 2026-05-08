import { nanoid } from "nanoid";
import type { INote } from "@/lib/db/models/Note";
import { renderPublicNote } from "@/lib/publishing/render-public-note";
import { normalizeNoteVisibility, type NoteVisibility } from "@/lib/publishing/visibility";

type NoteSnapshotSource = Pick<INote, "title" | "content" | "contentText" | "shareId" | "publishedAt"> & {
  visibility?: unknown;
};

type NoteVisibilityLike = {
  visibility?: unknown;
};

export type NormalizedNoteResponse<T extends NoteVisibilityLike> = Omit<T, "visibility"> & {
  visibility: NoteVisibility;
};

export function normalizeNoteForResponse<T extends NoteVisibilityLike>(note: T): NormalizedNoteResponse<T> {
  return {
    ...note,
    visibility: normalizeNoteVisibility(note.visibility),
  };
}

export function clearPublishedFields() {
  return {
    shareId: null,
    publicHtml: null,
    publicMarkdown: null,
    publicToc: null,
    publishedAt: null,
  };
}

export async function buildPublishedSnapshot(
  note: NoteSnapshotSource,
  visibility: Exclude<NoteVisibility, "private">,
  shareId: string | null,
) {
  const snapshot = await renderPublicNote({
    title: note.title,
    content: note.content,
    contentText: note.contentText,
  });

  return {
    visibility,
    shareId,
    publicHtml: snapshot.html,
    publicMarkdown: snapshot.markdown,
    publicToc: snapshot.toc,
    publishedAt: note.publishedAt ?? new Date(),
  };
}

export async function generateUniqueShareId(
  exists: (candidate: string) => Promise<boolean>,
  maxAttempts = 10,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = nanoid(20);

    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  throw new Error("Could not generate unique share id");
}
