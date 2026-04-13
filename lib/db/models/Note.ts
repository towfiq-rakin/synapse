import { Schema, model, models, type Model, type Types } from "mongoose";
import { userIdField, type IUserOwnedDocument } from "./shared/ownership";

export type NoteType = "note" | "blog";
export type NoteVisibility = "private" | "public";

export interface INote extends IUserOwnedDocument {
  title: string;
  slug?: string;
  folderId: Types.ObjectId | null;
  content: string;
  contentText: string;
  type: NoteType;
  visibility: NoteVisibility;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    userId: userIdField,
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
      default: "Untitled",
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      match: /^[a-z0-9-]+$/,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },
    content: {
      type: String,
      default: "",
    },
    contentText: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["note", "blog"],
      default: "note",
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

noteSchema.index({ userId: 1, updatedAt: -1 });
noteSchema.index({ userId: 1, folderId: 1, updatedAt: -1 });
noteSchema.index(
  { userId: 1, folderId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slug: { $exists: true, $type: "string", $ne: "" },
    },
  },
);

const Note = (models.Note as Model<INote>) || model<INote>("Note", noteSchema);

export default Note;
