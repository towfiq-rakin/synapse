import { auth, clerkClient } from "@clerk/nextjs/server"

type ClerkIssue = {
  code?: string
  message?: string
  longMessage?: string
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

function getPasswordErrorResponse(error: unknown) {
  const issue = getClerkIssues(error)[0]

  switch (issue?.code) {
    case "form_password_pwned":
      return {
        status: 400,
        body: {
          error: "This password has appeared in a data breach. Choose a different password.",
          fieldErrors: {
            newPassword: "Choose a different password.",
          },
        },
      }
    case "form_password_length_too_short":
      return {
        status: 400,
        body: {
          error: "Use at least 8 characters for your password.",
          fieldErrors: {
            newPassword: "Use at least 8 characters.",
          },
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
          error: "Could not update password right now.",
          fieldErrors: {},
        },
      }
  }
}

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>

  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : ""
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : ""
  const signOutOfOtherSessions =
    typeof body.signOutOfOtherSessions === "boolean"
      ? body.signOutOfOtherSessions
      : true

  if (!currentPassword.trim()) {
    return Response.json(
      {
        error: "Enter your current password.",
        fieldErrors: { currentPassword: "Enter your current password." },
      },
      { status: 400 }
    )
  }

  if (newPassword.length < 8) {
    return Response.json(
      {
        error: "Use at least 8 characters for your password.",
        fieldErrors: { newPassword: "Use at least 8 characters." },
      },
      { status: 400 }
    )
  }

  const client = await clerkClient()

  try {
    await client.users.verifyPassword({
      userId,
      password: currentPassword,
    })
  } catch {
    return Response.json(
      {
        error: "The current password is incorrect.",
        fieldErrors: { currentPassword: "The current password is incorrect." },
      },
      { status: 400 }
    )
  }

  try {
    await client.users.updateUser(userId, {
      password: newPassword,
      signOutOfOtherSessions,
    })

    return Response.json({ success: true })
  } catch (error) {
    const response = getPasswordErrorResponse(error)
    return Response.json(response.body, { status: response.status })
  }
}
