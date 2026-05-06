import { auth, clerkClient } from "@clerk/nextjs/server"
import { getAuthenticatedUserId } from "@/lib/auth"
import User from "@/lib/db/models/User"
import { connectToDatabase } from "@/lib/db/mongoose"

type ClerkIssue = {
  code?: string
  message?: string
  longMessage?: string
}

function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function getClerkIssues(error: unknown): ClerkIssue[] {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as { errors?: unknown }).errors)
  ) {
    return (error as { errors: ClerkIssue[] }).errors
  }

  return []
}

function getUsernameErrorResponse(error: unknown) {
  const issue = getClerkIssues(error)[0]

  switch (issue?.code) {
    case "form_identifier_exists":
    case "form_identifier_exists__username":
      return {
        status: 409,
        body: {
          error: "That username is already taken.",
          fieldErrors: { username: "That username is already taken." },
        },
      }
    case "form_username_invalid_length":
    case "form_username_invalid_character":
    case "form_username_needs_non_number_char":
      return {
        status: 400,
        body: {
          error: "Use 3-32 lowercase letters, numbers, or hyphens.",
          fieldErrors: { username: "Use 3-32 lowercase letters, numbers, or hyphens." },
        },
      }
    case "too_many_requests":
      return {
        status: 429,
        body: {
          error: "Too many attempts. Please wait a moment and try again.",
          fieldErrors: {},
        },
      }
    default:
      return {
        status: 500,
        body: {
          error: "Could not update username right now.",
          fieldErrors: {},
        },
      }
  }
}

export async function PATCH(request: Request) {
  const { userId } = await auth.protect()
  const localUserId = await getAuthenticatedUserId()

  if (!userId || !localUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>

  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const username = normalizeUsername(body.username)

  if (!username) {
    return Response.json(
      {
        error: "Choose a username.",
        fieldErrors: { username: "Choose a username." },
      },
      { status: 400 }
    )
  }

  if (!/^[a-z0-9-]{3,32}$/.test(username)) {
    return Response.json(
      {
        error: "Use 3-32 lowercase letters, numbers, or hyphens.",
        fieldErrors: { username: "Use 3-32 lowercase letters, numbers, or hyphens." },
      },
      { status: 400 }
    )
  }

  await connectToDatabase()

  const localUser = await User.findById(localUserId)

  if (!localUser) {
    return Response.json({ error: "User not found" }, { status: 404 })
  }

  if (localUser.username === username) {
    return Response.json({ success: true, username })
  }

  const existingLocalUser = await User.exists({
    username,
    _id: { $ne: localUserId },
  })

  if (existingLocalUser) {
    return Response.json(
      {
        error: "That username is already taken.",
        fieldErrors: { username: "That username is already taken." },
      },
      { status: 409 }
    )
  }

  try {
    const client = await clerkClient()
    await client.users.updateUser(userId, { username })

    localUser.username = username
    await localUser.save()

    return Response.json({ success: true, username })
  } catch (error) {
    const response = getUsernameErrorResponse(error)
    return Response.json(response.body, { status: response.status })
  }
}
