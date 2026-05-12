import type { INoteTocItem, NoteVisibility } from "@/lib/db/models/Note";
import matter from "gray-matter";
import Folder, { type IFolder } from "@/lib/db/models/Folder";
import Note, { type INote } from "@/lib/db/models/Note";
import User, { type IUser } from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  buildFolderSegmentsById,
  findFolderIdBySegments,
  normalizePathSegments,
  slugFromText,
  toId,
  toNullableId,
  type FolderPathNode,
} from "@/lib/notes-path";
import { normalizePublicProfile, type NormalizedPublicProfile } from "@/lib/publishing/profile";
import { renderPublicNote } from "@/lib/publishing/render-public-note";
import { isPublishedProfileNote, normalizeNoteVisibility } from "@/lib/publishing/visibility";
import { looksLikeLegacyHtmlDocument } from "@/lib/content-format";

type StringLikeId = { toString(): string } | string;

type LeanPublicUser = Pick<IUser, "username" | "name" | "displayName" | "avatarUrl" | "bio" | "isPublicProfile" | "publishedAt"> & {
  _id: StringLikeId;
};

type LeanPublicFolder = Pick<IFolder, "name" | "slug" | "parentId" | "order"> & {
  _id: StringLikeId;
};

type LeanPublicNote = Pick<
  INote,
  | "fileName"
  | "title"
  | "slug"
  | "folderId"
  | "content"
  | "contentText"
  | "visibility"
  | "shareId"
  | "publicHtml"
  | "publicMarkdown"
  | "publicToc"
  | "publishedAt"
  | "updatedAt"
  | "createdAt"
> & {
  _id: StringLikeId;
  userId: StringLikeId;
};

export type PublicProfile = NormalizedPublicProfile & {
  id: string;
  avatarUrl: string;
};

export type PublicWorkspaceNote = {
  id: string;
  fileName: string;
  title: string;
  slug: string;
  folderId: string | null;
  path: string[];
  href: string;
  visibility: NoteVisibility;
  shareId: string | null;
  content: string;
  contentText: string;
  publicHtml: string | null;
  publicMarkdown: string | null;
  publicToc: INoteTocItem[] | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

export type PublicWorkspaceFolder = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  path: string[];
  children: PublicWorkspaceFolder[];
  notes: PublicWorkspaceNote[];
};

export type PublicWorkspaceTree = {
  profile: PublicProfile;
  indexNote: PublicWorkspaceNote | null;
  roots: PublicWorkspaceFolder[];
  unfiledNotes: PublicWorkspaceNote[];
  notes: PublicWorkspaceNote[];
  publishedNoteCount: number;
  folderCount: number;
};

export type PublicFolderListing = {
  folder: PublicWorkspaceFolder;
  notes: PublicWorkspaceNote[];
};

export type PublicProfileNoteResult = {
  profile: PublicProfile;
  note: PublicWorkspaceNote;
};

export type PublicShareNoteResult = {
  profile: PublicProfile;
  note: PublicWorkspaceNote;
};

export type ResolvedPublicSnapshot = {
  html: string;
  markdown: string | null;
  toc: INoteTocItem[];
};

type FolderNode = PublicWorkspaceFolder;

function isRootIndexNote(note: Pick<PublicWorkspaceNote, "slug" | "folderId">) {
  return note.folderId === null && note.slug === "index";
}

function buildPublicNoteHref(username: string, path: string[]) {
  return `/u/${username.toLowerCase()}/${path.join("/")}`;
}

function buildPublicProfileHref(username: string) {
  return `/u/${username.toLowerCase()}`;
}

function normalizePublicUser(user: LeanPublicUser): PublicProfile {
  const normalized = normalizePublicProfile(user);

  return {
    id: toId(user._id),
    avatarUrl: user.avatarUrl || "",
    ...normalized,
  };
}

function sortFolders(folders: FolderNode[]) {
  return [...folders].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.name.localeCompare(right.name);
  });
}

function sortNotes(notes: PublicWorkspaceNote[]) {
  return [...notes].sort((left, right) => left.title.localeCompare(right.title));
}

function countFolders(nodes: FolderNode[]): number {
  return nodes.reduce((count, node) => count + 1 + countFolders(node.children), 0);
}

function pathsMatch(left: string[], right: string[]) {
  return left.length === right.length && left.every((segment, index) => segment === right[index]);
}

function hasMatchingHeadingAnchors(html: string, toc: INoteTocItem[]) {
  if (toc.length === 0) {
    return true;
  }

  return toc.every((item) => html.includes(`id="${item.id}"`) || html.includes(`id='${item.id}'`));
}

function markdownContainsCodeFence(content: string | null | undefined) {
  return typeof content === "string" && /(^|\n)\s*```/.test(content);
}

function htmlContainsUnhighlightedCodeBlock(html: string | null | undefined) {
  if (typeof html !== "string" || html.length === 0) {
    return false;
  }

  return html.includes('class="language-') && !html.includes("hljs");
}

function hasExpectedCodeHighlighting(note: Pick<PublicWorkspaceNote, "content" | "publicHtml">) {
  if (!note.publicHtml) {
    return false;
  }

  if (htmlContainsUnhighlightedCodeBlock(note.publicHtml)) {
    return false;
  }

  if (markdownContainsCodeFence(note.content)) {
    return note.publicHtml.includes("hljs");
  }

  return true;
}

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, "\n");
}

function extractMarkdownBody(content: string | null | undefined) {
  if (typeof content !== "string") {
    return "";
  }

  const normalized = normalizeLineEndings(content).trim();

  if (!normalized) {
    return "";
  }

  const parsed = matter(normalized);
  return normalizeLineEndings(parsed.content).trim();
}

function hasFreshSnapshotContent(
  note: Pick<PublicWorkspaceNote, "content" | "publicMarkdown">,
) {
  const body = extractMarkdownBody(note.content);

  if (!body) {
    return note.publicMarkdown === null || note.publicMarkdown?.trim() === "";
  }

  if (looksLikeLegacyHtmlDocument(body)) {
    // Legacy HTML notes keep markdown snapshot as null; freshness is checked by HTML guards.
    return note.publicMarkdown === null;
  }

  if (typeof note.publicMarkdown !== "string") {
    return false;
  }

  return normalizeLineEndings(note.publicMarkdown).trim() === body;
}

function hasSafePublicLinks(html: string) {
  return !/(?:href\s*=\s*["'][^"']*(?:%5B|%5D|\[|\]|\(|\))[^"']*["'])/i.test(html);
}

function buildWorkspaceNote(
  note: LeanPublicNote,
  username: string,
  folderSegmentsById: Map<string, string[]>,
): PublicWorkspaceNote {
  const fileName = note.fileName?.trim() || note.title?.trim() || "Untitled";
  const title = note.title?.trim() || fileName;
  const slug = note.slug?.trim() || slugFromText(fileName);
  const folderId = toNullableId(note.folderId);
  const folderPath = folderId ? folderSegmentsById.get(folderId) ?? [] : [];
  const path = [...folderPath, slug];
  const href = !folderId && slug === "index" ? buildPublicProfileHref(username) : buildPublicNoteHref(username, path);

  return {
    id: toId(note._id),
    fileName,
    title,
    slug,
    folderId,
    path,
    href,
    visibility: normalizeNoteVisibility(note.visibility),
    shareId: note.shareId ?? null,
    content: note.content ?? "",
    contentText: note.contentText ?? "",
    publicHtml: note.publicHtml ?? null,
    publicMarkdown: note.publicMarkdown ?? null,
    publicToc: Array.isArray(note.publicToc) ? note.publicToc : null,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    publishedAt: note.publishedAt ?? null,
  };
}

function pruneFolderTree(nodes: FolderNode[]): FolderNode[] {
  return sortFolders(nodes)
    .map((node) => {
      const children = pruneFolderTree(node.children);
      const notes = sortNotes(node.notes);

      return {
        ...node,
        children,
        notes,
      };
    })
    .filter((node) => node.notes.length > 0 || node.children.length > 0);
}

function buildPublishedWorkspaceTreeFromDocs(
  profile: PublicProfile,
  folders: LeanPublicFolder[],
  notes: LeanPublicNote[],
): PublicWorkspaceTree {
  const folderNodes = new Map<string, FolderNode>();
  const folderSegmentsById = buildFolderSegmentsById(folders);

  for (const folder of folders) {
    const id = toId(folder._id);

    folderNodes.set(id, {
      id,
      name: folder.name,
      slug: folder.slug,
      parentId: toNullableId(folder.parentId),
      order: folder.order,
      path: folderSegmentsById.get(id) ?? [folder.slug],
      children: [],
      notes: [],
    });
  }

  const roots: FolderNode[] = [];

  for (const node of folderNodes.values()) {
    const parent = node.parentId ? folderNodes.get(node.parentId) : undefined;

    if (parent) {
      parent.children.push(node);
      continue;
    }

    roots.push(node);
  }

  const publishedNotes = notes
    .filter((note) => isPublishedProfileNote(note))
    .map((note) => buildWorkspaceNote(note, profile.username, folderSegmentsById));
  const indexNote = publishedNotes.find((note) => isRootIndexNote(note)) ?? null;
  const listedNotes = indexNote ? publishedNotes.filter((note) => note.id !== indexNote.id) : publishedNotes;

  const unfiledNotes: PublicWorkspaceNote[] = [];

  for (const note of listedNotes) {
    if (!note.folderId) {
      unfiledNotes.push(note);
      continue;
    }

    const folder = folderNodes.get(note.folderId);

    if (!folder) {
      unfiledNotes.push(note);
      continue;
    }

    folder.notes.push(note);
  }

  const prunedRoots = pruneFolderTree(roots);

  return {
    profile,
    indexNote,
    roots: prunedRoots,
    unfiledNotes: sortNotes(unfiledNotes),
    notes: [...listedNotes].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime()),
    publishedNoteCount: listedNotes.length,
    folderCount: countFolders(prunedRoots),
  };
}

async function findUserByUsername(username: string): Promise<LeanPublicUser | null> {
  await connectToDatabase();

  return User.findOne({ username: username.toLowerCase() })
    .select("_id username name displayName avatarUrl bio isPublicProfile publishedAt")
    .lean<LeanPublicUser | null>();
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const user = await findUserByUsername(username);

  if (!user) {
    return null;
  }

  const profile = normalizePublicUser(user);
  return profile.isPublicProfile ? profile : null;
}

export async function getPublishedWorkspaceTree(username: string): Promise<PublicWorkspaceTree | null> {
  const profile = await getPublicProfile(username);

  if (!profile) {
    return null;
  }

  const [folders, notes] = await Promise.all([
    Folder.find({ userId: profile.id })
      .sort({ parentId: 1, order: 1, name: 1 })
      .select("_id name slug parentId order")
      .lean<LeanPublicFolder[]>(),
    Note.find({ userId: profile.id, type: "note" })
      .sort({ updatedAt: -1 })
      .select(
        "_id userId fileName title slug folderId content contentText visibility shareId publicHtml publicMarkdown publicToc createdAt updatedAt publishedAt",
      )
      .lean<LeanPublicNote[]>(),
  ]);

  return buildPublishedWorkspaceTreeFromDocs(profile, folders, notes);
}

export async function getPublishedNoteByPath(
  username: string,
  notePath: string[],
): Promise<PublicProfileNoteResult | null> {
  const profile = await getPublicProfile(username);

  if (!profile) {
    return null;
  }

  const normalizedPath = normalizePathSegments(notePath);

  if (normalizedPath.length === 0) {
    return null;
  }

  const noteSlug = normalizedPath.at(-1);
  const folderPath = normalizedPath.slice(0, -1);

  if (!noteSlug) {
    return null;
  }

  const folders = await Folder.find({ userId: profile.id })
    .select("_id name slug parentId order")
    .lean<LeanPublicFolder[]>();

  const folderId = findFolderIdBySegments(folders as FolderPathNode[], folderPath);

  if (folderId === undefined) {
    return null;
  }

  const note = await Note.findOne({
    userId: profile.id,
    folderId,
    slug: noteSlug,
    type: "note",
  })
    .select("_id userId fileName title slug folderId content contentText visibility shareId publicHtml publicMarkdown publicToc createdAt updatedAt publishedAt")
    .lean<LeanPublicNote | null>();

  if (!note || !isPublishedProfileNote(note)) {
    return null;
  }

  const folderSegmentsById = buildFolderSegmentsById(folders);

  return {
    profile,
    note: buildWorkspaceNote(note, profile.username, folderSegmentsById),
  };
}

export async function getUnlistedNoteByShareId(shareId: string): Promise<PublicShareNoteResult | null> {
  const normalizedShareId = shareId.trim();

  if (!normalizedShareId) {
    return null;
  }

  await connectToDatabase();

  const note = await Note.findOne({ shareId: normalizedShareId, type: "note" })
    .select("_id userId fileName title slug folderId content contentText visibility shareId publicHtml publicMarkdown publicToc createdAt updatedAt publishedAt")
    .lean<LeanPublicNote | null>();

  if (!note) {
    return null;
  }

  const visibility = normalizeNoteVisibility(note.visibility);

  if (visibility === "private") {
    return null;
  }

  const profileDoc = await User.findById(note.userId)
    .select("_id username name displayName avatarUrl bio isPublicProfile publishedAt")
    .lean<LeanPublicUser | null>();

  if (!profileDoc) {
    return null;
  }

  const folders = note.folderId
    ? await Folder.find({ userId: toId(note.userId) })
        .select("_id name slug parentId order")
        .lean<LeanPublicFolder[]>()
    : [];

  const folderSegmentsById = buildFolderSegmentsById(folders);
  const profile = normalizePublicUser(profileDoc);

  return {
    profile,
    note: buildWorkspaceNote(note, profile.username, folderSegmentsById),
  };
}

export async function getResolvedPublicSnapshot(
  note: Pick<PublicWorkspaceNote, "title" | "content" | "contentText" | "publicHtml" | "publicMarkdown" | "publicToc">,
): Promise<ResolvedPublicSnapshot> {
  if (
    note.publicHtml &&
    hasSafePublicLinks(note.publicHtml) &&
    Array.isArray(note.publicToc) &&
    hasMatchingHeadingAnchors(note.publicHtml, note.publicToc) &&
    hasExpectedCodeHighlighting(note) &&
    hasFreshSnapshotContent(note)
  ) {
    return {
      html: note.publicHtml,
      markdown: note.publicMarkdown ?? null,
      toc: note.publicToc,
    };
  }

  const rendered = await renderPublicNote({
    title: note.title,
    content: note.content,
    contentText: note.contentText,
  });

  return {
    html: rendered.html,
    markdown: rendered.markdown,
    toc: rendered.toc,
  };
}

export function stripPublicHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildPublicExcerpt(
  input: Pick<PublicWorkspaceNote, "publicMarkdown" | "publicHtml" | "contentText">,
  maxLength = 160,
): string | null {
  const source = [input.publicMarkdown, input.publicHtml ? stripPublicHtml(input.publicHtml) : null, input.contentText]
    .find((value) => typeof value === "string" && value.trim().length > 0)
    ?.replace(/\s+/g, " ")
    .trim();

  if (!source) {
    return null;
  }

  if (source.length <= maxLength) {
    return source;
  }

  return `${source.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function getPublicProfileHref(username: string) {
  return buildPublicProfileHref(username);
}

export function getPublishedFolderListing(
  workspace: Pick<PublicWorkspaceTree, "roots">,
  notePath: string[],
): PublicFolderListing | null {
  const normalizedPath = normalizePathSegments(notePath);

  if (normalizedPath.length === 0) {
    return null;
  }

  let match: PublicWorkspaceFolder | null = null;

  function walk(nodes: PublicWorkspaceFolder[]) {
    for (const node of nodes) {
      if (pathsMatch(node.path, normalizedPath)) {
        match = node;
        return;
      }

      walk(node.children);

      if (match) {
        return;
      }
    }
  }

  walk(workspace.roots);

  if (!match) {
    return null;
  }

  const notes: PublicWorkspaceNote[] = [];

  function collect(node: PublicWorkspaceFolder) {
    notes.push(...node.notes);

    for (const child of node.children) {
      collect(child);
    }
  }

  collect(match);

  return {
    folder: match,
    notes: notes.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime()),
  };
}
