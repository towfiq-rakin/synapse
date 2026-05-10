import Folder from "@/lib/db/models/Folder";
import { buildFolderSegmentsById, slugFromText, type FolderPathNode } from "@/lib/notes-path";
import { normalizeNoteVisibility, type NoteVisibility } from "@/lib/publishing/visibility";

type StringLikeId = { toString(): string } | string;

export type PublicLinkableNote = {
  userId: StringLikeId;
  title: string;
  slug?: string;
  folderId: StringLikeId | null;
  visibility?: unknown;
  shareId: string | null;
};

export type NoteShareState = {
  visibility: NoteVisibility;
  shareId: string | null;
  shareUrl: string | null;
  publishedUrl: string | null;
  username: string;
  isPublicProfile: boolean;
};

function toId(value: StringLikeId): string {
  return typeof value === "string" ? value : value.toString();
}

function toNullableId(value: StringLikeId | null): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.toString();
}

export function buildShareUrl(shareId: string | null | undefined): string | null {
  if (!shareId) {
    return null;
  }

  return `/share/${shareId}`;
}

export async function buildPublishedNoteUrl(note: Pick<PublicLinkableNote, "userId" | "title" | "slug" | "folderId">, username: string): Promise<string> {
  const userId = toId(note.userId);
  const folders = await Folder.find({ userId }).select("_id slug parentId").lean<FolderPathNode[]>();
  const folderSegmentsById = buildFolderSegmentsById(folders);
  const folderId = toNullableId(note.folderId);
  const folderSegments = folderId ? folderSegmentsById.get(folderId) ?? [] : [];
  const noteSlug = note.slug?.trim() || slugFromText(note.title);

  return `/u/${username.toLowerCase()}/${[...folderSegments, noteSlug].join("/")}`;
}

export async function buildNoteShareState(
  note: PublicLinkableNote,
  owner: { username: string; isPublicProfile?: boolean | null },
): Promise<NoteShareState> {
  return {
    visibility: normalizeNoteVisibility(note.visibility),
    shareId: note.shareId ?? null,
    shareUrl: buildShareUrl(note.shareId),
    publishedUrl: await buildPublishedNoteUrl(note, owner.username),
    username: owner.username,
    isPublicProfile: Boolean(owner.isPublicProfile),
  };
}
