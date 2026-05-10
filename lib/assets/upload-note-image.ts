"use client";

type SignatureResponse = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadPreset: string;
};

type SavedAssetResponse = {
  asset: {
    id: string;
    publicId: string;
    secureUrl: string;
    width: number | null;
    height: number | null;
    bytes: number | null;
    format: string | null;
    originalFilename: string | null;
  };
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  original_filename?: string;
};

export type UploadedNoteImageAsset = {
  src: string;
  alt: string;
  publicId: string;
  assetId: string;
  width: number | null;
  height: number | null;
};

type UploadNoteImageOptions = {
  noteId: string;
  file: File;
  onProgress?: (event: { progress: number }) => void;
  abortSignal?: AbortSignal;
};

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === "string" && payload.error.trim() ? payload.error : fallback;
  } catch {
    return fallback;
  }
}

async function requestSignature(noteId: string): Promise<SignatureResponse> {
  const response = await fetch("/api/assets/cloudinary-signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ noteId }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not prepare image upload."));
  }

  return (await response.json()) as SignatureResponse;
}

function uploadToCloudinary(
  file: File,
  signature: SignatureResponse,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal,
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append("file", file);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", String(signature.timestamp));
    formData.append("signature", signature.signature);
    formData.append("folder", signature.folder);
    formData.append("upload_preset", signature.uploadPreset);

    const cleanup = () => {
      abortSignal?.removeEventListener("abort", handleAbort);
    };

    const handleAbort = () => {
      xhr.abort();
      cleanup();
      reject(new Error("Upload cancelled"));
    };

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`);
    xhr.responseType = "json";

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress?.({
        progress: Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100))),
      });
    });

    xhr.addEventListener("load", () => {
      cleanup();

      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
        resolve(xhr.response as CloudinaryUploadResponse);
        return;
      }

      const message =
        typeof xhr.response === "object" &&
        xhr.response !== null &&
        "error" in xhr.response &&
        typeof (xhr.response as { error?: { message?: unknown } }).error?.message === "string"
          ? ((xhr.response as { error: { message: string } }).error.message || "Upload failed")
          : "Upload failed";

      reject(new Error(message));
    });

    xhr.addEventListener("error", () => {
      cleanup();
      reject(new Error("Image upload failed."));
    });

    xhr.addEventListener("abort", () => {
      cleanup();
      reject(new Error("Upload cancelled"));
    });

    if (abortSignal?.aborted) {
      handleAbort();
      return;
    }

    abortSignal?.addEventListener("abort", handleAbort, { once: true });
    xhr.send(formData);
  });
}

async function saveAsset(noteId: string, upload: CloudinaryUploadResponse): Promise<SavedAssetResponse> {
  const response = await fetch("/api/assets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      noteId,
      provider: "cloudinary",
      publicId: upload.public_id,
      secureUrl: upload.secure_url,
      width: upload.width,
      height: upload.height,
      bytes: upload.bytes,
      format: upload.format,
      originalFilename: upload.original_filename,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not save image metadata."));
  }

  return (await response.json()) as SavedAssetResponse;
}

function fileNameToAlt(name: string) {
  return name.replace(/\.[^.]+$/, "").trim() || "Image";
}

export async function uploadNoteImageAsset({
  noteId,
  file,
  onProgress,
  abortSignal,
}: UploadNoteImageOptions): Promise<UploadedNoteImageAsset> {
  const signature = await requestSignature(noteId);
  const upload = await uploadToCloudinary(file, signature, onProgress, abortSignal);
  const saved = await saveAsset(noteId, upload);

  return {
    src: saved.asset.secureUrl,
    alt: fileNameToAlt(file.name),
    publicId: saved.asset.publicId,
    assetId: saved.asset.id,
    width: saved.asset.width,
    height: saved.asset.height,
  };
}
