/* eslint-disable */
import "server-only";

// Cloudinary reads CLOUDINARY_URL during configuration. Normalize/remove an
// invalid deployment value before loading the SDK so /api/upload can be built.
const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
if (cloudinaryUrl && !cloudinaryUrl.toLowerCase().startsWith("cloudinary://")) {
  delete process.env.CLOUDINARY_URL;
}

const { v2: cloudinary } = require("cloudinary") as typeof import("cloudinary");
const validUrl = cloudinaryUrl?.toLowerCase().startsWith("cloudinary://");

if (validUrl) {
  cloudinary.config({ cloudinary_url: cloudinaryUrl, secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };
