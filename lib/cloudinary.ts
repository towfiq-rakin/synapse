import { v2 as cloudinary } from "cloudinary";

type CloudinaryEnv = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
};

let configured = false;

function requireEnv(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required Cloudinary env var: ${name}`);
  }

  return value;
}

export function getCloudinaryEnv(): CloudinaryEnv {
  return {
    cloudName: requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
    apiSecret: requireEnv("CLOUDINARY_API_SECRET"),
    uploadPreset: requireEnv("CLOUDINARY_UPLOAD_PRESET"),
  };
}

export function getCloudinary() {
  if (!configured) {
    const env = getCloudinaryEnv();

    cloudinary.config({
      cloud_name: env.cloudName,
      api_key: env.apiKey,
      api_secret: env.apiSecret,
      secure: true,
    });

    configured = true;
  }

  return cloudinary;
}

export function buildNoteAssetFolder(userId: string, noteId: string) {
  return `notes/${userId}/${noteId}`;
}

function isCloudinaryImageUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return url.hostname === "res.cloudinary.com" && url.pathname.includes("/image/upload/");
  } catch {
    return false;
  }
}

export function getOptimizedCloudinaryImageUrl(src: string, width = 1600): string {
  if (!src || !isCloudinaryImageUrl(src)) {
    return src;
  }

  try {
    const url = new URL(src);
    url.pathname = url.pathname.replace(
      "/image/upload/",
      `/image/upload/f_auto,q_auto,c_limit,w_${Math.max(1, Math.round(width))}/`,
    );
    return url.toString();
  } catch {
    return src;
  }
}
