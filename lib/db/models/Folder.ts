import { Schema, model, models, type Model, type Types } from "mongoose";
import { userIdField, type IUserOwnedDocument } from "./shared/ownership";

export interface IFolder extends IUserOwnedDocument {
  name: string;
  slug: string;
  parentId: Types.ObjectId | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new Schema<IFolder>(
  {
    userId: userIdField,
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 140,
      match: /^[a-z0-9-]+$/,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

folderSchema.index({ userId: 1, parentId: 1, slug: 1 }, { unique: true });
folderSchema.index({ userId: 1, parentId: 1, order: 1 });

const Folder = (models.Folder as Model<IFolder>) || model<IFolder>("Folder", folderSchema);

export default Folder;
