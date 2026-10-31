import "server-only";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "./client";

export function uploadBuffer(
  buffer: Buffer,
  options: { folder: string; publicId: string },
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: "auto",
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload ke Cloudinary gagal"));
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export async function deleteAsset(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image",
) {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
}