import { Schema, type Types } from "mongoose";

export interface IUserOwnedDocument {
  userId: Types.ObjectId;
}

// Shared ownership field so every persisted domain document is user-scoped.
export const userIdField = {
  type: Schema.Types.ObjectId,
  required: true,
  ref: "User",
  immutable: true,
  index: true,
} as const;
