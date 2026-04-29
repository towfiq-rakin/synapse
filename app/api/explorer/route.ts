import { auth } from "@/lib/auth";
import { getExplorerPayload } from "@/lib/explorer";

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const explorer = await getExplorerPayload(userId);

  if (!explorer) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ explorer });
}
