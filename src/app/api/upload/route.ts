import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { uploadBuffer } from "@/lib/cloudinary/upload";
import { MAX_REQUEST_BYTES, UPLOAD_FOLDERS, type UploadFolder } from "@/lib/uploads/config";
import { validateUpload } from "@/lib/uploads/validate";

export const runtime = "nodejs";

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Silakan login terlebih dahulu", 401);
  if (user.mustChangePassword) return fail("Ganti password terlebih dahulu", 403);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_REQUEST_BYTES) return fail("Ukuran file terlalu besar", 413);

  const form = await req.formData().catch(() => null);
  if (!form) return fail("Request tidak valid", 400);

  const file = form.get("file");
  const folder = form.get("folder");

  if (!(file instanceof File)) return fail("File tidak ditemukan", 400);
  if (typeof folder !== "string" || !Object.hasOwn(UPLOAD_FOLDERS, folder)) {
    return fail("Folder tujuan tidak valid", 400);
  }

  const allowed = UPLOAD_FOLDERS[folder as UploadFolder];
  const checked = await validateUpload(file, allowed);
  if (!checked.ok) return fail(checked.error, checked.status);

  try {
    const uploaded = await uploadBuffer(checked.buffer, {
      folder: `concordia/${folder}`,
      publicId: randomUUID(),
    });

    return NextResponse.json(
      {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        resourceType: uploaded.resource_type,
        format: uploaded.format,
        bytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Upload Cloudinary gagal:", error);
    return fail("Gagal mengunggah file, coba lagi", 502);
  }
}