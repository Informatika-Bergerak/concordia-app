-- Kolom baru
ALTER TABLE "User"
  ADD COLUMN "newId" INTEGER,
  ADD COLUMN "fotoProfil" TEXT,
  ADD COLUMN "jurusan" TEXT,
  ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 0;

-- Beri nomor urut berdasarkan waktu pembuatan akun
UPDATE "User" AS u
SET "newId" = s.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn
  FROM "User"
) AS s
WHERE u."id" = s."id";

-- Ganti primary key lama dengan kolom angka
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
ALTER TABLE "User" DROP COLUMN "id";
ALTER TABLE "User" RENAME COLUMN "newId" TO "id";
ALTER TABLE "User" ALTER COLUMN "id" SET NOT NULL;

-- Auto increment, dimulai setelah nomor terbesar
CREATE SEQUENCE "User_id_seq" OWNED BY "User"."id";
SELECT setval('"User_id_seq"', (SELECT COALESCE(MAX("id"), 0) + 1 FROM "User"), false);
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('"User_id_seq"');

ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");