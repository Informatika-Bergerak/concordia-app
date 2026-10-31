import "server-only";
import { v2 as cloudinary } from "cloudinary";

// SDK otomatis membaca CLOUDINARY_URL dari environment
cloudinary.config({ secure: true });

export { cloudinary };