import { Types } from "mongoose";
import Note from "@/lib/db/models/Note";

type OwnedNote = {
  _id: { toString(): string } | string;
};

export function isValidNoteId(value: unknown): value is string {
  return typeof value === "string" && Types.ObjectId.isValid(value);
}

export async function findOwnedNote(noteId: string, userId: string) {
  return Note.findOne({ _id: noteId, userId })
    .select("_id")
    .lean<OwnedNote | null>();
}

export function normalizeOriginalFilename(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 255) : null;
}

export function coercePositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.round(value);
  return rounded > 0 ? rounded : null;
}
