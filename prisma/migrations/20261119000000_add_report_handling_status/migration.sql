-- Tahap penanganan laporan: Diproses (IN_PROGRESS) dan Selesai (RESOLVED).
-- Nilai enum baru hanya ditambahkan; data laporan yang ada tidak diubah.
ALTER TYPE "ReportStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "ReportStatus" ADD VALUE IF NOT EXISTS 'RESOLVED';
