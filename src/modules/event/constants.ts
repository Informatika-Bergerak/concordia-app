export const EVENT_CATEGORIES = [
  "Akademik",
  "Seminar",
  "Workshop",
  "Sosial",
  "Olahraga",
  "Teknologi",
  "Kesenian",
  "Lainnya",
] as const;

export const CONCORDIA_GROUPS = [
  "Informatika Bergerak",
  "Jual Beli Barang Hilang",
  "GRUP KITA",
  "futsal",
  "ML",
  "MBAA IF",
  "Pemuda Tangguh",
  "KOS SEMINAR",
  "EVENT IIIK",
  "Freelance",
  "YKP HEBAT",
  "Pembelajaran Informatika",
  "Kuliah Umum",
];

export const EVENT_FILTERS = [
  { id: "all", label: "Semua Event" },
  { id: "upcoming", label: "Event Mendatang" },
  { id: "nearest", label: "Event Terdekat" },
  { id: "online", label: "Event Online" },
  { id: "offline", label: "Event Offline" },
  { id: "joined", label: "Event yang Saya Ikuti" },
  { id: "created", label: "Event yang Saya Buat" },
  { id: "interested", label: "Event yang Saya Tandai Interested" },
] as const;

export const BRAND_COLORS = {
  primaryLight: "#F4DBDB",
  secondaryLight: "#E49F9F",
  accentRed: "#CD5656",
  primaryRed: "#B80E0E",
  darkRed: "#8A0B0B",
  maroon: "#5C0707",
  deepMaroon: "#2E0404",
};
