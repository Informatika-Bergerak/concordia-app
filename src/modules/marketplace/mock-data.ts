/**
 * DATA SEMENTARA untuk pengembangan UI.
 * Ganti dengan query Prisma (modules/marketplace/queries.ts) saat backend Marketplace selesai.
 */
import type { ActivityItem, ListingDetail, ListingSummary, NotificationItem } from "./types";

const DEFAULT_SELLER = { name: "Erlangga Yuda Pratama", major: "Teknik Informatika" };
const MOCK_PHOTOS = {
  helicopter: "/assets/marketplace/helicopter.svg",
  iphone: "/assets/marketplace/iphone.svg",
  laptop: "/assets/marketplace/laptop.svg",
  toyCar: "/assets/marketplace/toy-car.svg",
  sweater: "/assets/marketplace/sweater.svg",
  book: "/assets/marketplace/book.svg",
  boardingHouse: "/assets/marketplace/boarding-house.svg",
  printing: "/assets/marketplace/printing.svg",
};

const LISTINGS: ListingDetail[] = [
  {
    id: 1,
    slug: "helikopter-second-2019",
    title: "Helikopter Second 2019",
    price: 9_200_000_000,
    location: "Sumedang",
    photoUrl: MOCK_PHOTOS.helicopter,
    category: "VEHICLES",
    condition: "USED",
    availability: "AVAILABLE",
    description:
      "Helikopter bekas tahun 2019, BPKB lengkap (STNK hilang). Mesin aman, satu baling-baling perlu diganti.",
    specs: [
      { label: "Mesin", value: "Twin turbine" },
      { label: "Tahun", value: "2019" },
      { label: "Kapasitas", value: "6 penumpang" },
    ],
    details: [
      { label: "Kondisi", value: "Bekas, mesin aman" },
      { label: "Dokumen", value: "BPKB lengkap, STNK hilang" },
      { label: "Catatan", value: "Baling-baling perlu diganti satu" },
    ],
    seller: DEFAULT_SELLER,
    allowCod: true,
    allowShipping: false,
    postedAt: "2026-11-10T08:00:00.000Z",
  },
  {
    id: 2,
    slug: "iphone-12-pro-max-aseli",
    title: "iPhone 12 Pro Max ASELI",
    price: 5_999_999,
    location: "Bandung",
    photoUrl: MOCK_PHOTOS.iphone,
    category: "ELECTRONICS",
    condition: "USED",
    availability: "AVAILABLE",
    description: "iPhone 12 Pro Max 256 GB, fullset dengan dus. Baterai 86%, tidak ada minus fungsi.",
    specs: [
      { label: "Penyimpanan", value: "256 GB" },
      { label: "Warna", value: "Pacific Blue" },
    ],
    details: [
      { label: "Kondisi", value: "Bekas, mulus" },
      { label: "Kelengkapan", value: "Fullset" },
    ],
    seller: { name: "Rizky Pratama", major: "Sistem Informasi" },
    allowCod: true,
    allowShipping: true,
    postedAt: "2026-11-12T10:30:00.000Z",
  },
  {
    id: 3,
    slug: "asus-tuf-gaming-f15",
    title: "ASUS TUF Gaming F15",
    price: 12_699_000,
    location: "Kopo",
    photoUrl: MOCK_PHOTOS.laptop,
    category: "ELECTRONICS",
    condition: "USED",
    availability: "LIMITED",
    description: "Laptop gaming ASUS TUF F15, RAM 16 GB, SSD 512 GB, RTX 3050. Pemakaian 1 tahun, garansi masih aktif.",
    specs: [
      { label: "Prosesor", value: "Intel Core i5" },
      { label: "RAM", value: "16 GB" },
      { label: "Penyimpanan", value: "SSD 512 GB" },
    ],
    details: [
      { label: "Kondisi", value: "Bekas, 1 tahun pemakaian" },
      { label: "Garansi", value: "Masih aktif" },
    ],
    seller: { name: "Siti Aisyah", major: "Teknik Informatika" },
    allowCod: true,
    allowShipping: true,
    postedAt: "2026-11-13T14:00:00.000Z",
  },
  {
    id: 4,
    slug: "hotwheels-koleksi",
    title: "Hotwheels Koleksi",
    price: 125_000,
    location: "Bandung",
    photoUrl: MOCK_PHOTOS.toyCar,
    category: "OTHER",
    condition: "NEW",
    availability: "AVAILABLE",
    description: "Hotwheels seri Bugatti Veyron, segel utuh, cocok untuk koleksi.",
    specs: [{ label: "Skala", value: "1:64" }],
    details: [{ label: "Kondisi", value: "Baru, segel utuh" }],
    seller: { name: "Rizky Pratama", major: "Sistem Informasi" },
    allowCod: true,
    allowShipping: true,
    postedAt: "2026-11-14T09:00:00.000Z",
  },
  {
    id: 5,
    slug: "sweater-crewneck-cokelat",
    title: "Sweater Crewneck Cokelat",
    price: 150_000,
    location: "Bandung",
    photoUrl: MOCK_PHOTOS.sweater,
    category: "FASHION",
    condition: "NEW",
    availability: "AVAILABLE",
    description: "Sweater crewneck bahan fleece, ukuran L, belum pernah dipakai.",
    specs: [
      { label: "Ukuran", value: "L" },
      { label: "Bahan", value: "Fleece" },
    ],
    details: [{ label: "Kondisi", value: "Baru, belum dipakai" }],
    seller: { name: "Siti Aisyah", major: "Teknik Informatika" },
    allowCod: true,
    allowShipping: true,
    postedAt: "2026-11-15T07:30:00.000Z",
  },
  {
    id: 6,
    slug: "buku-algoritma-dan-struktur-data",
    title: "Buku Algoritma dan Struktur Data",
    price: 85_000,
    location: "Kampus Sangga Buana",
    photoUrl: MOCK_PHOTOS.book,
    category: "BOOKS",
    condition: "USED",
    availability: "AVAILABLE",
    description: "Buku kuliah Algoritma dan Struktur Data, ada sedikit coretan pensil di bab 3.",
    specs: [{ label: "Penerbit", value: "Informatika" }],
    details: [{ label: "Kondisi", value: "Bekas, layak pakai" }],
    seller: DEFAULT_SELLER,
    allowCod: true,
    allowShipping: false,
    postedAt: "2026-11-16T12:00:00.000Z",
  },
  {
    id: 7,
    slug: "kamar-kos-dekat-kampus",
    title: "Kamar Kos Dekat Kampus",
    price: 900_000,
    location: "Banjar",
    photoUrl: MOCK_PHOTOS.boardingHouse,
    category: "BOARDING_HOUSE",
    condition: "NEW",
    availability: "LIMITED",
    description: "Kamar kos putra ukuran 3x4 m, kamar mandi dalam, harga per bulan, jalan kaki 5 menit ke kampus.",
    specs: [{ label: "Ukuran", value: "3 x 4 m" }],
    details: [
      { label: "Fasilitas", value: "Kamar mandi dalam, Wi-Fi" },
      { label: "Pembayaran", value: "Per bulan" },
    ],
    seller: DEFAULT_SELLER,
    allowCod: true,
    allowShipping: false,
    postedAt: "2026-11-17T06:00:00.000Z",
  },
  {
    id: 8,
    slug: "jasa-print-dan-jilid-skripsi",
    title: "Jasa Print dan Jilid Skripsi",
    price: 500,
    location: "Banjar",
    photoUrl: MOCK_PHOTOS.printing,
    category: "SERVICES",
    condition: "NEW",
    availability: "AVAILABLE",
    description: "Print hitam putih per lembar, jilid softcover dan hardcover. Bisa kirim file lewat pesan.",
    specs: [{ label: "Harga", value: "Rp. 500 per lembar" }],
    details: [{ label: "Estimasi", value: "1 hari kerja" }],
    seller: { name: "Rizky Pratama", major: "Sistem Informasi" },
    allowCod: true,
    allowShipping: false,
    postedAt: "2026-11-18T08:00:00.000Z",
  },
];

function toSummary({ id, slug, title, price, location, photoUrl, category, condition, availability }: ListingDetail): ListingSummary {
  return { id, slug, title, price, location, photoUrl, category, condition, availability };
}

export function getMockListings(): ListingSummary[] {
  return LISTINGS.map(toSummary);
}

export function getMockListing(slug: string): ListingDetail | null {
  return LISTINGS.find((item) => item.slug === slug) ?? null;
}

export function getMockOffers(): ActivityItem[] {
  return [
    { id: 1, slug: "helikopter-second-2019", title: "Helikopter Second 2019", price: 9_200_000_000, photoUrl: MOCK_PHOTOS.helicopter, availability: "AVAILABLE", action: "Ditawarkan", date: "2026-11-17T00:00:00.000Z" },
    { id: 2, slug: "asus-tuf-gaming-f15", title: "ASUS TUF Gaming F15", price: 14_000_000, photoUrl: MOCK_PHOTOS.laptop, availability: "AVAILABLE", action: "Ditawarkan", date: "2026-11-17T00:00:00.000Z" },
  ];
}

export function getMockSaved(): ActivityItem[] {
  return [
    { id: 3, slug: "iphone-12-pro-max-aseli", title: "iPhone 12 Pro Max ASELI", price: 5_999_999, photoUrl: MOCK_PHOTOS.iphone, availability: "AVAILABLE", action: "Disimpan", date: "2026-11-16T00:00:00.000Z" },
    { id: 4, slug: "kamar-kos-dekat-kampus", title: "Kamar Kos Dekat Kampus", price: 900_000, photoUrl: MOCK_PHOTOS.boardingHouse, availability: "LIMITED", action: "Disimpan", date: "2026-11-18T00:00:00.000Z" },
  ];
}

export function getMockNotifications(): NotificationItem[] {
  return [
    { id: 1, text: "Penjual membalas pertanyaanmu di Helikopter Second 2019.", date: "2026-11-18T00:00:00.000Z", slug: "helikopter-second-2019" },
    { id: 2, text: "Stok ASUS TUF Gaming F15 tinggal sedikit.", date: "2026-11-17T00:00:00.000Z", slug: "asus-tuf-gaming-f15" },
  ];
}
