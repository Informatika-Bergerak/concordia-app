import type { PrismaClient } from "../src/generated/prisma/client";
import type {
  ReportCategory,
  ReportStatus,
  ReportVisibility,
} from "../src/generated/prisma/enums";
import { slugify } from "../src/modules/report/slug";

// Data contoh laporan SafeCampus untuk pengembangan. Penulis laporan memakai akun yang dibuat
// oleh seed.ts (mahasiswa, dosen, dan moderator). Aman dijalankan berulang: laporan yang slug-nya
// sudah ada dilewati, jadi data yang sudah diubah atau dihapus manual tidak ditimpa.

type SampleReport = {
  title: string;
  description: string;
  location: string;
  category: ReportCategory;
  status: ReportStatus;
  visibility: ReportVisibility;
  /** Username pelapor (NPM, NIDN, atau "moderator") */
  author: string;
  /** Berapa hari yang lalu laporan dibuat */
  daysAgo: number;
  rejectionReason?: string;
  /** Username pendukung; hanya untuk laporan Public/Anonymous yang tidak ditolak */
  supporters?: string[];
};

const MAHASISWA = {
  gilang: "2113231092",
  iqbal: "2113231110",
  aulia: "2113231012",
  bayu: "2113231018",
  citra: "2113231029",
  dimas: "2113231033",
  eka: "2113231041",
  fajar: "2113231047",
  gita: "2113231052",
  hafidz: "2113231058",
  intan: "2113231063",
  joko: "2113231067",
};
const DOSEN = { fauzi: "0411058501", bambang: "0403068205" };
const MODERATOR = "moderator";

const ALL_SUPPORTERS = Object.values(MAHASISWA);

const SAMPLES: SampleReport[] = [
  {
    title: "Proyektor Ruang 3EE Tidak Menyala",
    description:
      "Proyektor di ruang 3EE tidak menyala sejak awal minggu. Perkuliahan jadi terganggu karena dosen tidak bisa menampilkan materi.",
    location: "Ruang Kelas 3EE",
    category: "FASILITAS",
    status: "UNVERIFIED",
    visibility: "PUBLIC",
    author: MAHASISWA.aulia,
    daysAgo: 1,
    supporters: [MAHASISWA.bayu, MAHASISWA.citra, MAHASISWA.dimas],
  },
  {
    title: "Lampu Koridor Lantai 2 Mati",
    description:
      "Lampu di koridor lantai 2 Gedung A mati sejak kemarin sore, sehingga koridor gelap dan berbahaya saat kelas malam.",
    location: "Gedung A lantai 2",
    category: "FASILITAS",
    status: "VERIFIED",
    visibility: "PUBLIC",
    author: MAHASISWA.bayu,
    daysAgo: 6,
    supporters: [MAHASISWA.aulia, MAHASISWA.citra, MAHASISWA.eka, MAHASISWA.fajar, MAHASISWA.gita],
  },
  {
    title: "AC Lab Komputer Bocor",
    description:
      "AC di lab komputer meneteskan air tepat di atas deretan meja. Khawatir mengenai perangkat dan stopkontak.",
    location: "Lab Komputer",
    category: "FASILITAS",
    status: "VERIFIED",
    visibility: "PUBLIC",
    author: MAHASISWA.citra,
    daysAgo: 8,
    supporters: [MAHASISWA.bayu, MAHASISWA.dimas, MAHASISWA.hafidz, MAHASISWA.intan],
  },
  {
    title: "Sampah Menumpuk di Belakang Kantin",
    description:
      "Tempat sampah di belakang kantin penuh dan belum diangkut beberapa hari. Baunya sampai ke area duduk.",
    location: "Belakang Kantin",
    category: "KEBERSIHAN",
    status: "UNVERIFIED",
    visibility: "PUBLIC",
    author: MAHASISWA.dimas,
    daysAgo: 2,
    supporters: [MAHASISWA.aulia, MAHASISWA.joko],
  },
  {
    title: "Toilet Lantai 3 Kotor dan Bau",
    description: "Toilet lantai 3 kotor dan berbau, air di beberapa bilik tidak mengalir.",
    location: "Gedung B lantai 3",
    category: "KEBERSIHAN",
    status: "REJECTED",
    visibility: "PUBLIC",
    author: MAHASISWA.eka,
    daysAgo: 7,
    rejectionReason: "Laporan duplikat dengan laporan toilet gedung B yang sudah ditangani.",
  },
  {
    title: "Motor Hilang di Parkiran Gedung A",
    description:
      "Sebuah motor hilang dari parkiran Gedung A pada jam kuliah siang. Mohon pengecekan rekaman CCTV dan penambahan petugas parkir.",
    location: "Parkiran Gedung A",
    category: "KEHILANGAN",
    status: "VERIFIED",
    visibility: "PUBLIC",
    author: MAHASISWA.fajar,
    daysAgo: 5,
    supporters: [
      MAHASISWA.aulia,
      MAHASISWA.bayu,
      MAHASISWA.citra,
      MAHASISWA.gita,
      MAHASISWA.hafidz,
      MAHASISWA.joko,
    ],
  },
  {
    title: "Orang Tidak Dikenal Masuk Gedung Malam Hari",
    description:
      "Beberapa kali terlihat orang yang bukan mahasiswa maupun staf berkeliaran di lorong gedung setelah pukul 20.00.",
    location: "Gedung C",
    category: "KEAMANAN",
    status: "UNVERIFIED",
    visibility: "ANONYMOUS",
    author: MAHASISWA.gita,
    daysAgo: 3,
    supporters: [MAHASISWA.dimas, MAHASISWA.eka, MAHASISWA.intan],
  },
  {
    title: "Mahasiswa Merokok di Area Kelas",
    description:
      "Masih ada mahasiswa yang merokok di area kelas dan koridor, padahal sudah ada papan kawasan bebas rokok.",
    location: "Koridor Gedung D",
    category: "KEBIJAKAN",
    status: "UNVERIFIED",
    visibility: "ANONYMOUS",
    author: MAHASISWA.intan,
    daysAgo: 4,
    supporters: [MAHASISWA.hafidz],
  },
  {
    title: "WiFi Kampus Sangat Lambat",
    description:
      "Jaringan WiFi kampus sangat lambat saat jam kuliah, sulit membuka materi dan mengumpulkan tugas daring.",
    location: "Gedung E",
    category: "FASILITAS",
    status: "UNVERIFIED",
    visibility: "PUBLIC",
    author: MAHASISWA.gilang,
    daysAgo: 2,
    supporters: ALL_SUPPORTERS.filter((u) => u !== MAHASISWA.gilang).slice(0, 7),
  },
  {
    title: "Keluhan soal Jadwal Praktikum Bentrok",
    description:
      "Jadwal praktikum bentrok dengan kelas teori sehingga saya harus memilih salah satu. Mohon penjadwalan ulang.",
    location: "Ruang Akademik",
    category: "LAINNYA",
    status: "UNVERIFIED",
    visibility: "PRIVATE",
    author: MAHASISWA.iqbal,
    daysAgo: 3,
  },
  {
    title: "Kursi Rusak di Ruang Seminar",
    description: "Beberapa kursi di ruang seminar patah dan membahayakan.",
    location: "Ruang Seminar",
    category: "FASILITAS",
    status: "REJECTED",
    visibility: "PUBLIC",
    author: MAHASISWA.aulia,
    daysAgo: 9,
    rejectionReason:
      "Foto dan lokasi tidak jelas. Silakan buat laporan baru dengan detail yang lebih lengkap.",
  },
  // Laporan dosen dan moderator: disorot di panel admin selama belum diverifikasi.
  {
    title: "Kabel Proyektor Aula Rusak",
    description:
      "Kabel HDMI proyektor di aula rusak dan sering terputus saat seminar sehingga tampilan layar mati sendiri.",
    location: "Aula Utama",
    category: "FASILITAS",
    status: "UNVERIFIED",
    visibility: "PUBLIC",
    author: DOSEN.fauzi,
    daysAgo: 1,
    supporters: [MAHASISWA.aulia, MAHASISWA.bayu],
  },
  {
    title: "Akses Parkir Dosen Sering Terhalang",
    description:
      "Jalur masuk parkir dosen sering terhalang kendaraan yang berhenti sembarangan, terutama pada pagi hari.",
    location: "Parkiran Dosen",
    category: "KEAMANAN",
    status: "UNVERIFIED",
    visibility: "ANONYMOUS",
    author: DOSEN.bambang,
    daysAgo: 2,
  },
  {
    title: "Pagar Samping Gedung B Rusak",
    description:
      "Pagar di sisi samping Gedung B bengkok dan terbuka sehingga orang bisa masuk tanpa melewati pos penjaga.",
    location: "Samping Gedung B",
    category: "KEAMANAN",
    status: "UNVERIFIED",
    visibility: "PUBLIC",
    author: MODERATOR,
    daysAgo: 1,
    supporters: [MAHASISWA.citra, MAHASISWA.dimas, MAHASISWA.gita],
  },
  {
    title: "Tempat Sampah Taman Kampus Penuh",
    description:
      "Tempat sampah di taman kampus penuh dan sampah berserakan ke area duduk. Perlu penambahan dan jadwal pengangkutan.",
    location: "Taman Kampus",
    category: "KEBERSIHAN",
    status: "VERIFIED",
    visibility: "PUBLIC",
    author: MODERATOR,
    daysAgo: 10,
    supporters: [MAHASISWA.eka, MAHASISWA.fajar],
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

type HistoryRow = {
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus;
  note: string | null;
  changedById: number | null;
  createdAt: Date;
};

export async function seedReports(prisma: PrismaClient): Promise<void> {
  const usernames = new Set<string>(["admin1", MODERATOR]);
  for (const sample of SAMPLES) {
    usernames.add(sample.author);
    sample.supporters?.forEach((u) => usernames.add(u));
  }

  const users = await prisma.user.findMany({
    where: { username: { in: [...usernames] } },
    select: { id: true, username: true },
  });
  const idByUsername = new Map(users.map((u) => [u.username, u.id]));
  const adminId = idByUsername.get("admin1") ?? null;

  let created = 0;
  let skipped = 0;

  for (const [index, sample] of SAMPLES.entries()) {
    const slug = `${slugify(sample.title)}-s${String(index + 1).padStart(2, "0")}`;

    const exists = await prisma.report.findUnique({ where: { slug }, select: { id: true } });
    if (exists) {
      skipped++;
      continue;
    }

    const authorId = idByUsername.get(sample.author);
    if (!authorId) {
      console.warn(`Laporan "${sample.title}" dilewati: akun ${sample.author} belum ada`);
      skipped++;
      continue;
    }

    const createdAt = new Date(Date.now() - sample.daysAgo * DAY_MS);
    const occurredAt = new Date(createdAt.getTime() - DAY_MS);
    occurredAt.setUTCHours(0, 0, 0, 0);
    const reviewedAt = new Date(Math.min(Date.now(), createdAt.getTime() + DAY_MS));

    const history: HistoryRow[] = [
      { fromStatus: null, toStatus: "UNVERIFIED", note: null, changedById: authorId, createdAt },
    ];
    if (sample.status !== "UNVERIFIED") {
      history.push({
        fromStatus: "UNVERIFIED",
        toStatus: sample.status,
        note: sample.rejectionReason ?? null,
        changedById: adminId,
        createdAt: reviewedAt,
      });
    }

    const supporterIds = (sample.supporters ?? [])
      .map((u) => idByUsername.get(u))
      .filter((id): id is number => id !== undefined && id !== authorId);

    await prisma.report.create({
      data: {
        slug,
        title: sample.title,
        description: sample.description,
        location: sample.location,
        category: sample.category,
        status: sample.status,
        visibility: sample.visibility,
        occurredAt,
        rejectionReason: sample.status === "REJECTED" ? (sample.rejectionReason ?? null) : null,
        authorId,
        createdAt,
        history: { create: history },
        supports: {
          createMany: {
            data: supporterIds.map((userId) => ({ userId, createdAt })),
            skipDuplicates: true,
          },
        },
      },
    });
    created++;
  }

  console.log(`Seed laporan selesai: ${created} dibuat, ${skipped} dilewati`);
}
