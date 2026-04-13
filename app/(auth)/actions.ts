"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import User from "@/lib/db/models/User";
import { connectToDatabase } from "@/lib/db/mongoose";

export type AuthActionState = {
  error?: string;
  success?: string;
};

const RESERVED_USERNAMES = new Set([
  "app",
  "api",
  "admin",
  "blog",
  "login",
  "register",
  "signup",
  "feed",
  "settings",
  "u",
  "about",
]);

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string): boolean {
  return (
    /^[a-z0-9-]{3,32}$/.test(username) &&
    !username.startsWith("-") &&
    !username.endsWith("-")
  );
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getFormValue(formData, "email").toLowerCase();
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email or password." };
      }
      return { error: "Unable to sign in. Please try again." };
    }

    throw error;
  }

  return { success: "Signed in." };
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = getFormValue(formData, "name");
  const email = getFormValue(formData, "email").toLowerCase();
  const username = getFormValue(formData, "username").toLowerCase();
  const password = getFormValue(formData, "password");
  const confirmPassword = getFormValue(formData, "confirmPassword");

  if (!name || !email || !username || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (!isValidUsername(username)) {
    return {
      error:
        "Username must be 3-32 chars, lowercase letters/numbers/hyphens, and cannot start or end with a hyphen.",
    };
  }

  if (RESERVED_USERNAMES.has(username)) {
    return { error: "This username is reserved. Please choose another." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  await connectToDatabase();

  const existingEmailUser = await User.exists({ email });
  if (existingEmailUser) {
    return { error: "An account with this email already exists." };
  }

  const existingUsernameUser = await User.exists({ username });
  if (existingUsernameUser) {
    return { error: "This username is already taken." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await User.create({
      name,
      email,
      username,
      passwordHash,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return { error: "Email or username already exists." };
    }

    return { error: "Unable to create account right now. Please try again." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: "Account created. Please sign in from the login page." };
    }

    throw error;
  }

  return { success: "Account created." };
}
