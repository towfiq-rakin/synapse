"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

export type ClerkFieldName =
  | "identifier"
  | "password"
  | "first_name"
  | "last_name"
  | "username"
  | "email_address"
  | "code";

type FriendlyClerkErrorResult = {
  message: string;
  fieldErrors: Partial<Record<ClerkFieldName, string>>;
};

type ClerkIssue = {
  code?: string;
  message?: string;
  longMessage?: string;
  meta?: Record<string, unknown>;
};

export function isBlank(value: string) {
  return value.trim().length === 0;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidUsername(value: string) {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(value.trim());
}

export function isValidPassword(value: string) {
  return value.length >= 8;
}

function normalizeClerkFieldName(value: string): ClerkFieldName | null {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "identifier":
    case "password":
    case "username":
    case "code":
      return normalized;
    case "firstname":
    case "first_name":
      return "first_name";
    case "lastname":
    case "last_name":
      return "last_name";
    case "email":
    case "emailaddress":
    case "email_address":
      return "email_address";
    default:
      return null;
  }
}

function inferFieldName(issue: ClerkIssue): ClerkFieldName | null {
  const meta = issue.meta ?? {};
  const candidates = [meta.paramName, meta.name, meta.field, meta.attribute]
    .filter((value): value is string => typeof value === "string");

  for (const candidate of candidates) {
    const normalized = normalizeClerkFieldName(candidate);
    if (normalized) {
      return normalized;
    }
  }

  const message = `${issue.longMessage ?? ""} ${issue.message ?? ""}`.toLowerCase();

  if (message.includes("first name")) return "first_name";
  if (message.includes("last name")) return "last_name";
  if (message.includes("email address") || message.includes("email")) return "email_address";
  if (message.includes("username")) return "username";
  if (message.includes("password")) return "password";
  if (message.includes("verification code") || message.includes("code")) return "code";
  if (message.includes("identifier")) return "identifier";

  return null;
}

function getFriendlyMessageForIssue(issue: ClerkIssue) {
  const code = issue.code;
  const message = issue.message ?? "";
  const lower = message.toLowerCase();

  switch (code) {
    case "form_identifier_not_found":
      return "We could not find an account with those details.";
    case "form_password_incorrect":
      return "The password is incorrect.";
    case "form_identifier_exists":
      return "An account with this email or username already exists.";
    case "form_username_invalid_character":
    case "form_username_invalid_length":
      return "Choose a valid username using letters, numbers, underscores, or hyphens.";
    case "form_password_pwned":
      return "This password has appeared in a data breach. Choose a different password.";
    case "form_password_length_too_short":
      return "Use at least 8 characters for your password.";
    case "form_code_incorrect":
      return "The verification code is incorrect.";
    case "form_code_expired":
    case "verification_expired":
      return "The verification code expired. Request a new one.";
    case "too_many_requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      break;
  }

  if (lower.includes("identifier") && lower.includes("required")) {
    return "Enter your email address or username.";
  }

  if (lower.includes("password") && lower.includes("required")) {
    return "Enter your password.";
  }

  if ((lower.includes("email") || lower.includes("email address")) && lower.includes("required")) {
    return "Enter your email address.";
  }

  if (lower.includes("first name") && lower.includes("required")) {
    return "Enter your first name.";
  }

  if (lower.includes("last name") && lower.includes("required")) {
    return "Enter your last name.";
  }

  if (lower.includes("username") && lower.includes("required")) {
    return "Choose a username.";
  }

  if (lower.includes("code") && lower.includes("required")) {
    return "Enter the verification code.";
  }

  return "Authentication failed. Please check your details and try again.";
}

function getFriendlyFieldMessage(issue: ClerkIssue, fieldName: ClerkFieldName | null) {
  const code = issue.code;
  const message = issue.message ?? "";
  const lower = message.toLowerCase();

  if (!fieldName) {
    return null;
  }

  switch (fieldName) {
    case "identifier":
      if (code === "form_identifier_not_found") return "No account found with those details.";
      return "Enter your email address or username.";
    case "password":
      if (code === "form_password_incorrect") return "Password is incorrect.";
      if (code === "form_password_pwned") return "Choose a different password.";
      if (code === "form_password_length_too_short") return "Use at least 8 characters.";
      if (lower.includes("required")) return "Enter your password.";
      return "Check your password.";
    case "first_name":
      return "Enter your first name.";
    case "last_name":
      return "Enter your last name.";
    case "username":
      if (code === "form_identifier_exists") return "Username already taken.";
      if (code === "form_username_invalid_character" || code === "form_username_invalid_length") {
        return "Use 3-32 characters: letters, numbers, underscores, or hyphens.";
      }
      if (lower.includes("required")) return "Choose a username.";
      return "Check your username.";
    case "email_address":
      if (code === "form_identifier_exists") return "Email address already in use.";
      if (lower.includes("invalid")) return "Enter a valid email address.";
      if (lower.includes("required")) return "Enter your email address.";
      return "Check your email address.";
    case "code":
      if (code === "form_code_incorrect") return "The verification code is incorrect.";
      if (code === "form_code_expired" || code === "verification_expired") {
        return "The verification code expired. Request a new one.";
      }
      if (lower.includes("required")) return "Enter the verification code.";
      return "Check your verification code.";
    default:
      return null;
  }
}

export function getFriendlyClerkError(error: unknown): FriendlyClerkErrorResult {
  if (!isClerkAPIResponseError(error)) {
    return {
      message: "Something went wrong. Please try again.",
      fieldErrors: {},
    };
  }

  const issues = error.errors as ClerkIssue[];
  const fieldErrors: Partial<Record<ClerkFieldName, string>> = {};
  let message = "Authentication failed. Please check your details and try again.";

  for (const issue of issues) {
    const nextMessage = getFriendlyMessageForIssue(issue);
    if (message === "Authentication failed. Please check your details and try again.") {
      message = nextMessage;
    }

    const fieldName = inferFieldName(issue);
    const fieldMessage = getFriendlyFieldMessage(issue, fieldName);

    if (fieldName && fieldMessage && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = fieldMessage;
    }
  }

  return { message, fieldErrors };
}
