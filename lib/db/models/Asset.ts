import { Schema, model, models, type Model, type Types } from "mongoose";
import { userIdField, type IUserOwnedDocument } from "./shared/ownership";

export type AssetProvider = "cloudinary";

export interface IAsset extends IUserOwnedDocument {
  noteId: Types.ObjectId;
  provider: AssetProvider;
  publicId: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  originalFilename: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const assetSchema = new Schema<IAsset>(
  {
    userId: userIdField,
    noteId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Note",
      immutable: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["cloudinary"],
      required: true,
      default: "cloudinary",
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    secureUrl: {
      type: String,
      required: true,
      trim: true,
    },
    width: {
      type: Number,
      default: null,
      min: 1,
    },
    height: {
      type: Number,
      default: null,
      min: 1,
    },
    bytes: {
      type: Number,
      default: null,
      min: 1,
    },
    format: {
      type: String,
      default: null,
      trim: true,
    },
    originalFilename: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

assetSchema.index({ userId: 1, noteId: 1, createdAt: -1 });
assetSchema.index({ provider: 1, publicId: 1 }, { unique: true });

const Asset = (models.Asset as Model<IAsset>) || model<IAsset>("Asset", assetSchema);

export default Asset;
