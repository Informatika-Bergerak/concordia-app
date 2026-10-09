# Concordia App

## 🚀 Cara Menjalankan Lokal
1. Clone repositori: `git clone https://github.com/Informatika-Bergerak/concordia-app.git`
2. Install dependensi: `npm install`
3. Copy env file: `cp .env.example .env` (sesuaikan kredensial di `.env`)
4. Jalankan migrasi database: `npx prisma db push`
5. Mulai server development: `npm run dev`
6. Buka [http://localhost:3000](http://localhost:3000)

## 🏗 Keputusan Teknis
- **Framework:** Next.js (App Router) + TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** NextAuth.js / Auth.js
- **Penyimpanan Foto:** AWS S3 compatible (Cloudinary / MinIO)