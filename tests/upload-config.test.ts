import { afterEach, describe, expect, it, vi } from "vitest";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "../src/modules/marketplace/constants";
import { validateListingForm, type ListingFormValues } from "../src/modules/marketplace/form-validation";
import { uploadFile } from "../src/lib/uploads/client";
import { MAX_REQUEST_BYTES, UPLOAD_FOLDERS, UPLOAD_RULES } from "../src/lib/uploads/config";

describe("daftar folder unggahan", () => {
  it("folder marketplace terdaftar dan hanya menerima gambar", () => {
    expect(Object.hasOwn(UPLOAD_FOLDERS, "marketplace")).toBe(true);
    expect(UPLOAD_FOLDERS.marketplace).toEqual(["image"]);
  });

  it("folder yang sudah dipakai modul lain tidak berubah", () => {
    expect(UPLOAD_FOLDERS.reports).toEqual(["image", "document"]);
    expect(UPLOAD_FOLDERS.avatars).toEqual(["image"]);
    expect(UPLOAD_FOLDERS.forum).toEqual(["image"]);
    expect(UPLOAD_FOLDERS.groups).toEqual(["image"]);
    expect(UPLOAD_FOLDERS.groupChat).toEqual(["image"]);
    expect(UPLOAD_FOLDERS.activities).toEqual(["image", "document"]);
  });

  it("nama folder aman dipakai sebagai bagian jalur Cloudinary (concordia/<folder>)", () => {
    for (const folder of Object.keys(UPLOAD_FOLDERS)) {
      expect(folder, folder).toMatch(/^[a-z][A-Za-z0-9]*$/);
    }
  });

  it("nama bawaan objek tidak dianggap folder yang sah", () => {
    // Endpoint memeriksa dengan Object.hasOwn; nama seperti ini tidak boleh lolos.
    for (const name of ["__proto__", "constructor", "toString", "hasOwnProperty", "marketplace/../reports", ""]) {
      expect(Object.hasOwn(UPLOAD_FOLDERS, name), name).toBe(false);
    }
  });

  it("setiap folder hanya memuat jenis berkas yang punya aturan", () => {
    for (const [folder, kinds] of Object.entries(UPLOAD_FOLDERS)) {
      expect(kinds.length, folder).toBeGreaterThan(0);
      for (const kind of kinds) expect(UPLOAD_RULES[kind], `${folder}:${kind}`).toBeDefined();
    }
  });

  it("batas ukuran request menampung berkas terbesar ditambah overhead multipart", () => {
    const biggest = Math.max(...Object.values(UPLOAD_RULES).map((r) => r.maxBytes));
    // Audio 10 MB memang di atas batas request; yang dijaga di sini adalah gambar dan dokumen (4 MB).
    expect(MAX_REQUEST_BYTES).toBeGreaterThan(UPLOAD_RULES.image.maxBytes);
    expect(MAX_REQUEST_BYTES).toBeGreaterThan(UPLOAD_RULES.document.maxBytes);
    expect(biggest).toBeGreaterThanOrEqual(UPLOAD_RULES.image.maxBytes);
  });
});

describe("aturan foto Marketplace mengikuti aturan unggahan", () => {
  it("jenis dan ukuran foto di form sama dengan aturan gambar di /api/upload", () => {
    expect([...ALLOWED_PHOTO_TYPES]).toEqual([...UPLOAD_RULES.image.mimes]);
    expect(MAX_PHOTO_BYTES).toBe(UPLOAD_RULES.image.maxBytes);
  });

  it("form menolak foto yang akan ditolak server, dan menerima yang akan diterima", () => {
    const values: ListingFormValues = {
      title: "Buku Kalkulus",
      price: "50000",
      category: "BOOKS",
      condition: "USED",
      availability: "AVAILABLE",
      description: "Buku kuliah semester satu, masih bagus.",
      location: "Kampus",
      allowCod: true,
      allowShipping: false,
    };
    const check = (type: string, size: number) =>
      "photo" in validateListingForm(values, { type, size }, { requirePhoto: true });

    for (const mime of UPLOAD_RULES.image.mimes) {
      expect(check(mime, UPLOAD_RULES.image.maxBytes), mime).toBe(false);
      expect(check(mime, UPLOAD_RULES.image.maxBytes + 1), mime).toBe(true);
    }
    expect(check("image/gif", 1000)).toBe(true);
    expect(check("application/pdf", 1000)).toBe(true);
  });
});

describe("uploadFile (klien)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const image = (size: number) => new File([new Uint8Array(size)], "foto.jpg", { type: "image/jpeg" });

  it("mengirim berkas ke /api/upload dengan folder marketplace dan mengembalikan hasilnya", async () => {
    const result = {
      url: "https://res.cloudinary.com/demo/image/upload/v1/concordia/marketplace/abc.jpg",
      publicId: "concordia/marketplace/abc",
      resourceType: "image",
      format: "jpg",
      bytes: 1000,
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadFile(image(1000), "marketplace")).resolves.toEqual(result);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/upload");
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get("folder")).toBe("marketplace");
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
  });

  it("menolak berkas di atas batas sebelum menghubungi server", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadFile(image(4 * 1024 * 1024 + 1), "marketplace")).rejects.toThrow("maksimal 4 MB");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("meneruskan pesan error dari server", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Folder tujuan tidak valid" }) }));
    await expect(uploadFile(image(10), "marketplace")).rejects.toThrow("Folder tujuan tidak valid");
  });

  it("memakai pesan umum bila server tidak mengirim JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => { throw new Error("bukan json"); } }));
    await expect(uploadFile(image(10), "marketplace")).rejects.toThrow("Upload gagal");
  });
});
