-- AlterTable: kolom dibuat boleh kosong dulu agar laporan yang sudah ada bisa diisi
ALTER TABLE "Report" ADD COLUMN "slug" TEXT;

-- Isi slug laporan yang sudah ada: judul yang dinormalkan (aksen dibuang, huruf kecil, tanda hubung, maks. 50 karakter)
-- diikuti 6 karakter acak agar unik dan tidak bisa ditebak dari nomor urut.
UPDATE "Report"
SET "slug" = trim(both '-' from left(
      coalesce(
        nullif(trim(both '-' from lower(regexp_replace(
          translate("title", 'áàâäãåāéèêëēíìîïīóòôöõōúùûüūçñýÿÁÀÂÄÃÅĀÉÈÊËĒÍÌÎÏĪÓÒÔÖÕŌÚÙÛÜŪÇÑÝŸ', 'aaaaaaaeeeeeiiiiioooooouuuuucnyyAAAAAAAEEEEEIIIIIOOOOOOUUUUUCNYY'),
          '[^a-zA-Z0-9]+', '-', 'g'))), ''),
        'laporan'
      ), 50))
    || '-' || substr(md5("id"::text || clock_timestamp()::text || random()::text), 1, 6);

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Report_slug_key" ON "Report"("slug");
