# ConCordia — Panduan CI/CD Tim

## 1. Membaca Hasil CI

1. Buka repository ConCordia di GitHub.
2. Pilih tab **Actions** untuk melihat proses CI.
3. Status hijau berarti seluruh pemeriksaan wajib berhasil.
4. Status merah berarti ada langkah yang gagal. Buka detail workflow dan periksa log untuk mengetahui penyebabnya.
5. Perbaiki masalah pada branch terkait, kemudian push ulang agar CI berjalan kembali.

## 2. Membuka Preview Website

1. Buka Pull Request yang sedang dikerjakan.
2. Cari URL Preview yang dibuat oleh Vercel.
3. Buka URL tersebut untuk menguji perubahan.
4. Gunakan Preview untuk pengujian sebelum perubahan digabungkan ke branch `main`.
5. Jika Preview belum tersedia, periksa status deployment atau hubungi pengelola Vercel.

## 3. Alur Ready for QA

1. Developer menyelesaikan fitur dan mengirim perubahan ke repository.
2. CI dijalankan dan seluruh pemeriksaan wajib harus berhasil.
3. Pull Request ditinjau sesuai aturan tim.
4. Jika sudah memenuhi kriteria untuk diuji, tambahkan label `ready-for-qa`.
5. QA menguji fitur melalui Preview berdasarkan acceptance criteria dari System Analyst.
6. Jika ditemukan bug, QA mencatat langkah reproduksi dan melaporkannya kepada developer.
7. Developer memperbaiki bug dan QA melakukan pengujian ulang.

## 4. Keamanan Konfigurasi

- Jangan menyimpan password, API key, atau token rahasia di repository.
- Simpan secrets di GitHub Actions atau Vercel sesuai kebutuhan.
- Gunakan `.env.example` untuk mendokumentasikan nama variabel tanpa nilai rahasia.
- Jangan menggabungkan perubahan ke `main` jika pemeriksaan wajib gagal.

**Catatan:** Panduan ini merupakan rancangan awal. Sesuaikan dengan konfigurasi repository, aturan review, dan alur QA yang disepakati tim.