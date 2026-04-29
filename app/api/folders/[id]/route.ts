import { Types } from "mongoose"
import { auth } from "@/lib/auth"
import Folder from "@/lib/db/models/Folder"
import Note from "@/lib/db/models/Note"
import { connectToDatabase } from "@/lib/db/mongoose"
import { getExplorerPayload, normalizeName } from "@/lib/explorer"
import { generateUniqueSlug } from "@/lib/notes-path"

type RouteContext = {
  params: Promise<{ id: string }>
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  if (!Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid folder id" }, { status: 400 })
  }

  let body: Record<string, unknown>

  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const name = normalizeName(body.name, 120)
  if (!name) {
    return Response.json({ error: "Folder name is required" }, { status: 400 })
  }

  await connectToDatabase()

  const folder = await Folder.findOne({ _id: id, userId }).select("_id parentId name slug").lean<{
    _id: { toString(): string }
    parentId: { toString(): string } | string | null
    name: string
    slug: string
  } | null>()

  if (!folder) {
    return Response.json({ error: "Folder not found" }, { status: 404 })
  }

  const parentId =
    folder.parentId === null
      ? null
      : typeof folder.parentId === "string"
        ? folder.parentId
        : folder.parentId.toString()

  const nextSlug = await generateUniqueSlug(name, async (candidate) => {
    const existing = await Folder.exists({
      _id: { $ne: id },
      userId,
      parentId,
      slug: candidate,
    })
    return Boolean(existing)
  })

  const updated = await Folder.findOneAndUpdate(
    { _id: id, userId },
    { $set: { name, slug: nextSlug } },
    { new: true, runValidators: true }
  ).lean()

  const explorer = await getExplorerPayload(userId)

  return Response.json({ folder: updated, explorer })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId()

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  if (!Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid folder id" }, { status: 400 })
  }

  await connectToDatabase()

  const rootFolder = await Folder.findOne({ _id: id, userId }).select("_id").lean<{ _id: { toString(): string } } | null>()
  if (!rootFolder) {
    return Response.json({ error: "Folder not found" }, { status: 404 })
  }

  const allFolders = await Folder.find({ userId }).select("_id parentId").lean<Array<{
    _id: { toString(): string } | string
    parentId: { toString(): string } | string | null
  }>>()

  const childMap = new Map<string, string[]>()
  for (const folder of allFolders) {
    const parentId = folder.parentId
      ? typeof folder.parentId === "string"
        ? folder.parentId
        : folder.parentId.toString()
      : null
    if (!parentId) continue
    const list = childMap.get(parentId) ?? []
    list.push(typeof folder._id === "string" ? folder._id : folder._id.toString())
    childMap.set(parentId, list)
  }

  const idsToDelete = new Set<string>([rootFolder._id.toString()])
  const queue = [rootFolder._id.toString()]

  while (queue.length > 0) {
    const current = queue.shift()!
    const children = childMap.get(current) ?? []
    for (const childId of children) {
      if (idsToDelete.has(childId)) continue
      idsToDelete.add(childId)
      queue.push(childId)
    }
  }

  const objectIds = Array.from(idsToDelete).map((folderId) => new Types.ObjectId(folderId))

  await Promise.all([
    Folder.deleteMany({ userId, _id: { $in: objectIds } }),
    Note.deleteMany({ userId, folderId: { $in: objectIds } }),
  ])

  const explorer = await getExplorerPayload(userId)
  return Response.json({ ok: true, explorer })
}
