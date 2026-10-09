# ConCordia — Environment Variables Planning

## Tujuan

Mendokumentasikan kebutuhan konfigurasi aplikasi ConCordia tanpa menyimpan nilai rahasia di repository.

## Daftar Kebutuhan

| Kategori | Informasi yang perlu dikonfirmasi |
|---|---|
| Database | Nama variabel koneksi database yang digunakan backend |
| Authentication | Variabel konfigurasi autentikasi dan secret yang diperlukan |
| Photo Storage | Variabel untuk menyimpan foto laporan SafeCampus |
| Frontend API | URL API yang digunakan oleh frontend |
| Deployment | Variabel yang diperlukan untuk Preview dan Production |

## Aturan Keamanan

1. Nama variabel harus mengikuti implementasi yang ditentukan BE.
2. Nilai rahasia tidak boleh ditulis dalam dokumen ini.
3. File `.env` lokal tidak boleh diunggah ke repository.
4. File `.env.example` harus berisi nama variabel yang dibutuhkan dengan nilai contoh yang aman.
5. Secrets untuk GitHub Actions dan Vercel dikelola sesuai kebutuhan masing-masing environment.

## Status

- [ ] Konfirmasi teknologi frontend dan backend.
- [ ] Konfirmasi database dan layanan autentikasi.
- [ ] Konfirmasi layanan penyimpanan foto.
- [ ] Periksa `.gitignore`.
- [ ] Buat atau perbarui `.env.example`.
- [ ] Konfigurasi secrets setelah akses dan kebutuhan dikonfirmasi.

**Catatan:** Daftar ini merupakan rencana awal. Belum ada nama variabel aktual yang ditetapkan karena implementasi aplikasi belum tersedia.