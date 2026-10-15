# Concordia App

## 🚀 Cara Menjalankan Lokal
1. Clone repositori: `git clone https://github.com/Informatika-Bergerak/concordia-app.git`
2. Install dependensi: `npm install`
3. Copy env file: `cp .env.example .env` (sesuaikan kredensial di `.env`)
4. Jalankan migrasi database: `npx prisma db push`
5. Mulai server development: `npm run dev`
6. Buka [http://localhost:3000](http://localhost:3000)

## 📁 Struktur Modul
Proyek ini menggunakan arsitektur Modular Monolith dengan pembagian direktori:
- `src/modules/forum`: Mengelola diskusi dan postingan pengguna.
- `src/modules/activities`: Mengelola event, kegiatan, dan partisipasi.
- `src/modules/report`: Mengelola pelaporan pengguna/konten dan moderasi.
- `src/modules/trust`: Mengelola sistem poin/reputasi dan validasi.
- `src/lib`: Kode internal yang digunakan bersama (auth, instance database).

## 🏗 Keputusan Teknis (Tech Stack)
- **Framework:** Next.js (App Router) + TypeScript Strict
- **Database Provider:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **Penyimpanan Foto/File:** Cloudinary