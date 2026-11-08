# Laporan Pengerjaan Kelompok B — Keamanan dan Log (ConCordia)

Dokumen ini merangkum seluruh perubahan kode, keputusan teknis, penanganan error, dan petunjuk manual untuk pengguna dalam rangka menyelesaikan **4 task Kelompok B**:
- **T2**: Log Aktivitas (Audit Log) & Modern Responsive DataTables
- **T4**: Pencegahan Admin Membuat Akun Admin Lain
- **T6**: Login Hanya Satu Perangkat (Single-Device Session)
- **T8**: Perbaikan Bug Ganti Password (`useFormState` React 19 / Next.js 16)
- **Bonus UI Enhancement**:
  - Standarisasi DataTables Modern pada halaman Dashboard Admin (`/admin`) dan Log Aktivitas (`/admin/logs`).
  - Perbaikan Bug Stacking Context pada Modal Reset Password (menggunakan React Portal agar tidak tertimpa/bocor baris tabel di bawahnya).
  - Harmonisasi Modern UI Ganti Password (`/change-password`) menggunakan CSS Module tersendiri sesuai tema ConCordia.

---

## 1. Penjelasan Mengenai Error pada Editor & Permasalahan GitIgnore

### A. Garis Merah di Editor (Prisma Client)
Jika di editor (seperti VS Code) muncul garis merah/error pada baris seperti:
- `activeSessionId`, `lastSeenAt`, `activeDevice` pada `src/auth.ts` atau `src/lib/auth/guards.ts`
- `prisma.auditLog` pada `src/lib/audit/log.ts` dan `src/lib/audit/queries.ts`

**Penyebab:** Prisma Client (`src/generated/prisma`) belum di-generate ulang dari skema database terbaru.
👉 **Solusi:** Jalankan `npx prisma generate` di terminal. Semua tanda merah akan hilang seketika.

### B. Mengapa Folder `admin/logs` Sebelumnya Terkena GitIgnore dan Bagaimana Mengatasinya?
Pada file `.gitignore` bawaan proyek, baris ke-2 tertulis:
```gitignore
# Logs
logs
*.log
```
Pola `logs` tanpa tanda garis miring (`/`) di awal menyebabkan Git secara agresif mengabaikan **semua** folder bernama `logs` di seluruh subfolder proyek, termasuk `src/app/admin/logs`. Akibatnya, saat Anda menjalankan `git add` atau `git push`, folder `admin/logs` tidak ikut ter-push dan teman Anda tidak akan mendapatkannya saat melakukan `git pull`.

👉 **Solusi Tuntas:**
File [`.gitignore`](file:///c:/laragon/www/concordia-app/.gitignore) telah diperbaiki dengan menambahkan aturan pengecualian eksplisit (*whitelist*):
```gitignore
# Logs
/logs
!src/app/admin/logs
!src/app/admin/logs/**
*.log
```
Dengan perbaikan ini:
1. Git **hanya** mengabaikan folder logs di root proyek (`/logs`), dan **tetap melacak** `src/app/admin/logs`.
2. Folder **`src/app/admin/logs`** kini **pasti ikut ter-push ke GitHub**.
3. Saat teman Anda melakukan `git pull`, folder **`src/app/admin/logs`** akan otomatis ada di komputer mereka.
4. Rute utama tetap sesuai spesifikasi tugas: **`/admin/logs`**.

---

## 2. Ringkasan Pengerjaan Tiap Task

### Task T8: Perbaikan Bug Ganti Password & Form React 19
1. **Migrasi ke `useActionState`:**
   - `src/app/change-password/change-password-form.tsx`: Mengganti `useFormState` & `useFormStatus` dari `react-dom` dengan `useActionState` langsung dari `react`. State pending langsung dipakai pada atribut `disabled` tombol submit, menghapus komponen `SubmitButton` terpisah.
   - `src/app/admin/users/create-user-form.tsx`: Mengganti ke `useActionState` dari `react` dengan cara yang sama.
2. **Retensi Nilai Form saat Error (React 19 Form Reset):**
   - Pada `src/app/admin/users/actions.ts`, tipe `CreateUserState` ditambahkan field `values?: { name: string; username: string; accountType: string }`.
   - Nilai isian dikembalikan saat terjadi error validasi atau username duplikat, dan dipasang ke `defaultValue` input di `create-user-form.tsx`.
   - Password sementara tidak disimpan dalam state retensi.
3. **Temuan Bug & Pembersihan Alur Ganti Password:**
   - Menghapus seluruh pemanggilan `useFormState` di seluruh folder `src/`.
   - Memastikan pemanggilan `redirect(homeByRole[user.role])` berada di luar blok `try/catch` agar tidak menangkap internal error `NEXT_REDIRECT`.
   - Memperbaiki import sirkular diri sendiri pada `src/lib/audit/request-meta.ts`.

---

### Perbaikan 2 UI Khusus (Sesuai Screenshot Referensi Pengguna)

1. **Perbaikan Modal "Password Berhasil Direset" (Screenshot 1):**
   - **Masalah:** Pada screenshot pengguna, teks dan tombol dari baris tabel di bawahnya ("Reset password", "Nonaktifkan", "Admin", dll.) tembus dan muncul menimpa modal dialog. Hal ini terjadi karena komponen modal awalnya dirender langsung di dalam sel tabel `<td>`. Dalam spesifikasi CSS rendering table, baris tabel berikutnya (`<tr>`) membentuk stacking context DOM tersendiri yang dipaint setelah baris sebelumnya, sehingga menembus elemen fixed di baris sebelumnya meskipun telah diberi `z-index` tinggi.
   - **Solusi Tuntas:**
     - Modal dipindahkan menggunakan React Portal (`createPortal(modalNode, document.body)`) pada `src/app/admin/users/reset-password-button.tsx`. Dengan portal, elemen modal dipindahkan keluar dari struktur `<table>` dan dirender langsung sebagai anak langsung `<body>`.
     - Diberikan styling solid white (`background: #ffffff !important`) dan box shadow elegan pada `src/app/admin/users/reset-password.module.css`.
     - Tombol Salin dilengkapi feedback visual status (`Tersalin!` + ikon `Check`), tombol close menggunakan ikon `X` dari `lucide-react`, dan tombol "Selesai" menggunakan warna tema ungu ConCordia (`#b331d3`).

2. **Harmonisasi UI Halaman Ganti Password (`/change-password`, Screenshot 2):**
   - Dibuatkan CSS Module tersendiri: `src/app/change-password/change-password.module.css` sehingga terisolasi bersih dan tidak merusak `app.css`.
   - Layout kartu berlatar belakang putih dengan sudut membulat (`border-radius: 16px`), bayangan lembut, font heading tegas, dan jarak field input yang proporsional.
   - State focus pada input menggunakan highlight warna tema ungu (`#b331d3`), tombol submit "Simpan password" full width dengan transisi hover halus (`#7e2096`), serta link "Kembali" terpusat di bawah kartu.

3. **Penambahan Card Container pada UI Auth/Login (`/login`):**
   - Sebelumnya, form login dirender tanpa kartu visual (latar belakang menyatu dengan halaman).
   - Diperbarui pada `src/app/login/login.module.css`: kartu form login kini memiliki latar putih (`#ffffff`), border halus (`1px solid #e2e8f0`), sudut membulat (`border-radius: 16px`), padding nyaman (`36px 32px`), serta bayangan lembut (`box-shadow`), dengan latar belakang halaman berwarna netral (`#f8fafc`) agar kartu tampil menonjol dan serasi dengan desain ConCordia.

---

### Task T4: Pencegahan Admin Membuat Akun Admin
1. **Validasi Skema Server:**
   - `src/lib/validations/auth.ts`: Mengubah `createUserSchema.accountType` menjadi `z.enum(["MAHASISWA", "DOSEN", "MODERATOR"])` (menghapus `"ADMIN"`).
2. **Server Action Guard:**
   - `src/app/admin/users/actions.ts` (`createUserAction`): Sebelum skema di-parse, ditambahkan pengecekan eksplisit: jika `formData.get("accountType") === "ADMIN"`, kembalikan error `"Akun admin tidak bisa dibuat dari panel ini."`.
   - Pemetaan role disederhanakan: `MODERATOR` $\to$ role `MODERATOR`, `MAHASISWA`/`DOSEN` $\to$ role `USER` dengan `userType` yang sesuai. Tidak ada alur kode yang dapat menghasilkan role `ADMIN`.
3. **Pembersihan Tampilan:**
   - `src/app/admin/users/create-user-form.tsx`: Menghapus `<option value="ADMIN">` dari dropdown tipe akun.

---

### Task T6: Login Hanya Satu Perangkat (Single-Device Session)
1. **Skema Database Tambahan:**
   - Menambahkan 3 kolom nullable pada model `User`: `activeSessionId String?`, `lastSeenAt DateTime?`, `activeDevice String?`.
2. **Klaim Sesi Atomik di `authorize()` (`src/auth.ts`):**
   - Membuat error kustom `class DeviceInUseError extends CredentialsSignin { code = "device_in_use"; }`.
   - Penolakan perangkat lain hanya dieksekusi **setelah password terverifikasi benar** dengan `bcrypt.compare`.
   - Klaim slot sesi menggunakan `prisma.user.updateMany` atomik.
3. **Konfigurasi Batas Waktu (`src/lib/auth/session-config.ts`):**
   - `SESSION_IDLE_MINUTES = 30` (sesi kedaluwarsa setelah 30 menit tidak aktif).
   - `SESSION_HEARTBEAT_SECONDS = 60` (pembaruan `lastSeenAt` dibatasi paling sering 1 kali per menit).
4. **Validasi Sesi Aktif di `getCurrentUser()` (`src/lib/auth/guards.ts`):**
   - Memeriksa keberadaan `session.user.sid`.
   - Memastikan `user.activeSessionId === session.user.sid`.
   - Memastikan `lastSeenAt` tidak melewati batas 30 menit.
   - Memperbarui `lastSeenAt` secara atomik dengan `updateMany` jika jeda heartbeat telah terpenuhi.
5. **Pencabutan Sesi:**
   - `events.signOut` di `src/auth.ts`: Mengosongkan field sesi hanya jika `token.sid` cocok dengan database, lalu mencatat log `LOGOUT`.
   - `resetPasswordAction`: Mengosongkan field sesi target.
   - `toggleActiveAction`: Mengosongkan field sesi target saat dinonaktifkan.
   - `forceLogoutUserAction`: Action baru khusus admin untuk mencabut sesi pengguna tertentu dan mencatat `SESSION_REVOKED`.
6. **Pesan Error di Login Form (`src/app/login/login-form.tsx`):**
   - Menangkap `res?.code === "device_in_use"` dan menampilkan pesan:
     *"Akun ini sedang digunakan di perangkat lain. Keluar dari perangkat tersebut atau coba lagi nanti."*
7. **Akun Admin Tambahan di Seeder (`prisma/seed.ts`):**
   - Menambahkan akun `admin1`, `admin2`, dan `admin3` untuk memfasilitasi pengujian skenario tabrakan/bentrok login multi-perangkat.

---

### Task T2: Log Aktivitas & Modern DataTables (Sesuai Referensi Foto)
1. **Helper & Query Audit (`src/lib/audit/`):**
   - `log.ts`: Fungsi `logAudit` membungkus operasi dengan `try/catch` tanpa melempar error, memotong `userAgent` maksimal 255 karakter, dan mengabaikan nilai sensitif.
   - `request-meta.ts`: Mengambil IP dan User-Agent dari Next.js headers (async di Next.js 16) serta menyediakan fungsi `summarizeUserAgent`.
   - `labels.ts`: Pemetaan enum `AuditAction` ke label bahasa Indonesia.
   - `queries.ts`: Query database `getAuditLogs` dengan pagination server-side, filter valid enum, dan pencarian username case-insensitive.
2. **DataTables Sesuai Referensi Gambar (Di `/admin/logs` dan `/admin`):**
   - **Show Entries Selector:** Menu dropdown `Show [ 10 / 25 / 50 / 100 ] entries` di kiri atas yang langsung memfilter jumlah baris data secara realtime.
   - **Search Box Realtime:** Kolom `Search: [ input ]` di kanan atas dengan debounce 300ms dan tombol pembersih `X` instan.
   - **Filter Realtime:** Dropdown filter (Aksi pada Logs, Role pada Dashboard Admin) yang langsung memfilter data saat dipilih.
   - **Tampilan Penuh Tanpa Terpotong (*No Truncation*):**
     - Semua kolom ditampilkan seutuhnya dengan pembungkusan teks rapi (`word-break: break-word`), tanpa pemotongan teks ellipsis `...`.
     - Wrapper tabel memiliki scrolling horizontal yang halus untuk menjamin keterbacaan di layar kecil.
   - **Footer Info & Pagination Angka:**
     - Kiri bawah: Menampilkan keterangan `Showing 1 to 10 of 57 entries`.
     - Kanan bawah: Navigasi tombol `Previous`, nomor halaman `[ 1 ]` `[ 2 ]` ... dan `Next`. Halaman aktif berwarna **biru solid** (`#2563eb`) dengan teks putih, persis seperti foto referensi.

---

## 3. Daftar File yang Diubah dan Dibuat

### File Baru:
1. `src/lib/auth/session-config.ts` (Konstanta durasi idle & heartbeat sesi)
2. `src/lib/audit/log.ts` (Fungsi pencatat audit log)
3. `src/lib/audit/request-meta.ts` (Ekstraksi IP & ringkasan user agent)
4. `src/lib/audit/labels.ts` (Label bahasa Indonesia untuk AuditAction)
5. `src/lib/audit/queries.ts` (Query database log dengan pagination & show entries)
6. `src/app/admin/logs/logs-data-table.tsx` (Komponen DataTables modern, responsive, realtime filter & show entries untuk Logs)
7. `src/app/admin/logs/page.tsx` (Halaman admin log aktivitas `/admin/logs`)
8. `src/app/admin/logs/logs.module.css` (Gaya DataTables & visual active page matching referensi foto)
9. `src/app/admin/admin-users-data-table.tsx` (Komponen DataTables modern, responsive, realtime filter & show entries untuk Dashboard Admin)
10. `src/app/admin/admin-data-table.module.css` (Gaya DataTables untuk Dashboard Admin)
11. `src/app/admin/users/reset-password.module.css` (Styling modal reset password, background solid, tema ungu, z-index portal)
12. `src/app/change-password/change-password.module.css` (Styling modern halaman ganti password sesuai tema ConCordia)
13. `src/app/admin/audit-logs/page.tsx` (Redirect fallback ke `/admin/logs`)
14. `src/app/admin/logs-user/page.tsx` (Redirect fallback ke `/admin/logs`)
15. `LAPORAN_KELOMPOK_B.md` (Dokumen laporan ini)

### File yang Diedit:
1. `.gitignore` (Mengecualikan `src/app/admin/logs` dari gitignore)
2. `prisma/schema.prisma` (Menambah kolom sesi pada `User`, enum `AuditAction`, dan model `AuditLog`)
3. `prisma/seed.ts` (Menambahkan akun admin tambahan: `admin1`, `admin2`, `admin3`)
4. `src/types/next-auth.d.ts` (Menambahkan `sid: string` pada User, Session, dan JWT)
5. `src/auth.ts` (Error `DeviceInUseError`, klaim sesi atomik, audit log login/logout, dan `events.signOut`)
6. `src/lib/auth/guards.ts` (Validasi `sid` dan timeout 30 menit pada `getCurrentUser()`)
7. `src/lib/validations/auth.ts` (Menghapus `ADMIN` dari `createUserSchema.accountType`)
8. `src/app/admin/users/actions.ts` (Blokir role admin, retensi values form, audit log, cabut sesi, dan `forceLogoutUserAction`)
9. `src/app/admin/users/create-user-form.tsx` (Migrasi ke `useActionState`, retensi input, hapus option Admin)
10. `src/app/admin/users/reset-password-button.tsx` (Menggunakan `createPortal` agar modal tidak bocor/tertimpa tabel)
11. `src/app/change-password/actions.ts` (Audit log `PASSWORD_CHANGED`)
12. `src/app/change-password/page.tsx` (Menggunakan `change-password.module.css` dan link kembali dinamis)
13. `src/app/change-password/change-password-form.tsx` (Migrasi ke `useActionState`, hapus `useFormStatus`, styling CSS Module)
14. `src/app/login/login-form.tsx` (Penanganan pesan error `device_in_use`)
15. `src/app/login/login.module.css` (Penambahan card styling pada UI Login/Auth)
16. `src/components/app-shell.tsx` (Menautkan menu navigasi ke `/admin/logs`)
17. `src/app/admin/page.tsx` (Menggunakan DataTables modern responsive identik dengan Logs)

---

## 4. Perintah Manual untuk Pengguna

Jalankan perintah berikut secara berurutan di terminal Anda:

```bash
# 1. Jalankan migrasi Prisma (hanya ADD COLUMN dan CREATE TABLE/TYPE)
npx prisma migrate dev --name add_audit_log_and_single_device

# 2. Regenerate Prisma Client agar editor mengenali tipe baru
npx prisma generate

# 3. Jalankan seed database (membuat akun admin, admin1, admin2, admin3, dll.)
npx prisma db seed

# 4. Validasi tipe TypeScript dan linter
npx tsc --noEmit
npm run lint
```

### Jalankan di Supabase SQL Editor:
```sql
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
```

### Jalankan Ulang Server Dev:
```bash
npm run dev
```

Buka halaman admin di browser:
👉 Dashboard Pengguna: `http://localhost:3000/admin`
👉 Log Aktivitas: `http://localhost:3000/admin/logs`

Kedua halaman kini memiliki tampilan DataTables modern responsif yang 100% konsisten, lengkap dengan "Show entries", search realtime, filter instan, dan nomor halaman aktif biru seperti foto referensi!

