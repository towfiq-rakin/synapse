import { Types, type HydratedDocument } from "mongoose";
import Folder, { type IFolder } from "@/lib/db/models/Folder";
import Note, { type INote } from "@/lib/db/models/Note";
import User from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  buildFolderSegmentsById,
  buildUserFolderHref,
  findFolderIdBySegments,
  generateUniqueSlug,
  normalizePathSegments,
  slugFromText,
  toId,
  toNullableId,
  type FolderPathNode,
} from "@/lib/notes-path";

type StringLikeId = { toString(): string } | string;

export type ExplorerUser = {
  id: string;
  username: string;
  name: string;
};

export type ExplorerFolder = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  path: string[];
  href: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ExplorerNote = {
  id: string;
  title: string;
  slug: string;
  folderId: string | null;
  path: string[];
  href: string;
  visibility: INote["visibility"];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type ExplorerPayload = {
  user: ExplorerUser;
  folders: ExplorerFolder[];
  notes: ExplorerNote[];
};

type LeanFolder = Pick<IFolder, "name" | "slug" | "parentId" | "order" | "createdAt" | "updatedAt"> & {
  _id: StringLikeId;
};

type LeanNote = Pick<INote, "title" | "slug" | "folderId" | "visibility" | "tags" | "createdAt" | "updatedAt"> & {
  _id: StringLikeId;
};

type LeanUser = {
  _id: StringLikeId;
  username: string;
  name: string;
};

function normalizeObjectId(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    return undefined;
  }

  return value;
}

function normalizePathInput(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    return normalizePathSegments(value.split("/"));
  }

  if (Array.isArray(value) && value.every((segment) => typeof segment === "string")) {
    return normalizePathSegments(value);
  }

  return undefined;
}

export function normalizeName(input: unknown, maxLength: number): string {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim().slice(0, maxLength);
}

export async function getExplorerUser(userId: string): Promise<ExplorerUser | null> {
  await connectToDatabase();

  const user = await User.findById(userId)
    .select("_id username name")
    .lean<LeanUser | null>();

  if (!user) {
    return null;
  }

  return {
    id: toId(user._id),
    username: user.username,
    name: user.name,
  };
}

export async function getExplorerPayload(userId: string): Promise<ExplorerPayload | null> {
  await connectToDatabase();

  const user = await getExplorerUser(userId);

  if (!user) {
    return null;
  }

  const [folders, notes] = await Promise.all([
    Folder.find({ userId })
      .sort({ parentId: 1, order: 1, name: 1 })
      .select("_id name slug parentId order createdAt updatedAt")
      .lean<LeanFolder[]>(),
    Note.find({ userId, type: "note" })
      .sort({ updatedAt: -1 })
      .select("_id title slug folderId visibility tags createdAt updatedAt")
      .lean<LeanNote[]>(),
  ]);

  const folderSegmentsById = buildFolderSegmentsById(folders);

  return {
    user,
    folders: folders.map((folder) => {
      const id = toId(folder._id);
      const path = folderSegmentsById.get(id) ?? [folder.slug];

      return {
        id,
        name: folder.name,
        slug: folder.slug,
        parentId: toNullableId(folder.parentId),
        order: folder.order,
        path,
        href: buildUserFolderHref(user.username, folder._id, folderSegmentsById),
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      };
    }),
    notes: notes.map((note) => {
      const folderId = toNullableId(note.folderId);
      const folderPath = folderId ? folderSegmentsById.get(folderId) ?? [] : [];
      return {
        id: toId(note._id),
        title: note.title || "Untitled",
        slug: note.slug || slugFromText(note.title),
        folderId,
        path: [...folderPath, note.slug || slugFromText(note.title)],
        href: `/notes/${toId(note._id)}`,
        visibility: note.visibility,
        tags: note.tags,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
    }),
  };
}

export async function resolveFolderIdFromBody(
  userId: string,
  body: Record<string, unknown>,
  keys: { id?: string; path?: string } = {},
): Promise<string | null | undefined> {
  const idKey = keys.id ?? "folderId";
  const pathKey = keys.path ?? "folderPath";
  const normalizedId = normalizeObjectId(body[idKey]);

  if (normalizedId !== undefined) {
    if (normalizedId === null) {
      return null;
    }

    const folderExists = await Folder.exists({ _id: normalizedId, userId });
    return folderExists ? normalizedId : undefined;
  }

  const pathSegments = normalizePathInput(body[pathKey]);

  if (pathSegments === undefined) {
    return null;
  }

  const folders = await Folder.find({ userId }).select("_id slug parentId").lean<FolderPathNode[]>();
  return findFolderIdBySegments(folders, pathSegments);
}

export async function createFolderForUser({
  userId,
  name,
  parentId,
}: {
  userId: string;
  name: string;
  parentId: string | null;
}): Promise<HydratedDocument<IFolder>> {
  const slug = await generateUniqueSlug(name, async (candidate) => {
    const existing = await Folder.exists({ userId, parentId, slug: candidate });
    return Boolean(existing);
  });

  const lastSibling = await Folder.findOne({ userId, parentId })
    .sort({ order: -1 })
    .select("order")
    .lean<{ order: number } | null>();

  return Folder.create({
    userId,
    name,
    slug,
    parentId,
    order: (lastSibling?.order ?? -1) + 1,
  });
}
