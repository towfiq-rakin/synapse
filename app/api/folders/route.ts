import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  createFolderForUser,
  getExplorerPayload,
  normalizeName,
  resolveFolderIdFromBody,
} from "@/lib/explorer";

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = normalizeName(body.name, 120);

  if (!name) {
    return Response.json({ error: "Folder name is required" }, { status: 400 });
  }

  await connectToDatabase();

  const parentId = await resolveFolderIdFromBody(userId, body, {
    id: "parentId",
    path: "parentPath",
  });

  if (parentId === undefined) {
    return Response.json({ error: "Parent folder not found" }, { status: 404 });
  }

  try {
    const folder = await createFolderForUser({ userId, name, parentId });
    const explorer = await getExplorerPayload(userId);
    const created = explorer?.folders.find((item) => item.id === folder._id.toString());

    return Response.json({ folder: created ?? folder.toObject(), explorer }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return Response.json({ error: "A folder with this name already exists." }, { status: 409 });
    }

    return Response.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
