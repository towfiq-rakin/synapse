import slugify from "slugify";

type StringLikeId = { toString(): string } | string;
type NullableId = StringLikeId | null;

export type FolderPathNode = {
  _id: StringLikeId;
  name?: string;
  slug: string;
  parentId: NullableId;
};

export type NotePathNode = {
  _id: StringLikeId;
  title: string;
  slug?: string;
  folderId: NullableId;
};

export function toId(value: StringLikeId): string {
  return typeof value === "string" ? value : value.toString();
}

export function toNullableId(value: NullableId): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.toString();
}

export function slugFromText(input: string, fallback = "untitled"): string {
  const computed = slugify(input, {
    lower: true,
    strict: true,
    trim: true,
  });

  return computed || fallback;
}

export function normalizePathSegments(segments: string[]): string[] {
  return segments
    .map((segment) => segment.trim().toLowerCase())
    .map((segment) => slugFromText(segment, ""))
    .filter((segment) => segment.length > 0);
}

export function buildFolderSegmentsById(folders: FolderPathNode[]): Map<string, string[]> {
  const byId = new Map<string, FolderPathNode>();

  for (const folder of folders) {
    byId.set(toId(folder._id), folder);
  }

  const memo = new Map<string, string[]>();

  function walk(folderId: string): string[] {
    const memoized = memo.get(folderId);
    if (memoized) {
      return memoized;
    }

    const folder = byId.get(folderId);
    if (!folder) {
      return [];
    }

    const parentId = toNullableId(folder.parentId);
    const parentSegments = parentId ? walk(parentId) : [];
    const next = [...parentSegments, folder.slug];
    memo.set(folderId, next);
    return next;
  }

  for (const folderId of byId.keys()) {
    walk(folderId);
  }

  return memo;
}

export function findFolderIdBySegments(
  folders: FolderPathNode[],
  segments: string[],
): string | null | undefined {
  if (segments.length === 0) {
    return null;
  }

  const scoped = new Map<string | null, FolderPathNode[]>();

  for (const folder of folders) {
    const parentId = toNullableId(folder.parentId);
    const items = scoped.get(parentId) ?? [];
    items.push(folder);
    scoped.set(parentId, items);
  }

  let parentId: string | null = null;

  for (const segment of segments) {
    const siblings = scoped.get(parentId) ?? [];
    const match = siblings.find((folder) => folder.slug.toLowerCase() === segment);

    if (!match) {
      return undefined;
    }

    parentId = toId(match._id);
  }

  return parentId;
}

export function buildPrivateNoteHref(
  note: NotePathNode,
  folderSegmentsById: Map<string, string[]>,
): string {
  const noteSlug = note.slug?.trim() || slugFromText(note.title);
  const folderId = toNullableId(note.folderId);
  const folderSegments = folderId ? folderSegmentsById.get(folderId) ?? [] : [];
  return `/${[...folderSegments, noteSlug].join("/")}`;
}

export function buildUserNoteHref(
  username: string,
  note: NotePathNode,
  folderSegmentsById: Map<string, string[]>,
): string {
  const notePath = buildPrivateNoteHref(note, folderSegmentsById);
  return `/${username.toLowerCase()}${notePath}`;
}

export function buildUserFolderHref(
  username: string,
  folderId: StringLikeId,
  folderSegmentsById: Map<string, string[]>,
): string {
  const folderSegments = folderSegmentsById.get(toId(folderId)) ?? [];
  return `/${[username.toLowerCase(), ...folderSegments].join("/")}`;
}

export function parseFrontmatterTitle(input: string): string | null {
  const normalized = input.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    return null;
  }

  const end = normalized.indexOf("\n---", 4);
  if (end === -1) {
    return null;
  }

  const frontmatterBody = normalized.slice(4, end);
  const lines = frontmatterBody.split("\n");

  for (const line of lines) {
    const match = line.match(/^\s*title\s*:\s*(.+?)\s*$/i);
    if (!match) {
      continue;
    }

    const raw = match[1].trim();
    const unquoted = raw.replace(/^['"]|['"]$/g, "");
    return unquoted || null;
  }

  return null;
}

export async function generateUniqueSlug(
  baseText: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const seed = slugFromText(baseText);
  let candidate = seed;
  let suffix = 2;

  while (await exists(candidate)) {
    candidate = `${seed}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
