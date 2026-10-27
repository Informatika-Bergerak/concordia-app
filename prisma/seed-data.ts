import type { UserType } from "../src/generated/prisma/enums";

export type SeedUser = {
  username: string; // NPM untuk mahasiswa, NIDN untuk dosen
  name: string;
  userType: UserType;
};

export const mahasiswa: SeedUser[] = [
  { username: "2113231084", name: "Ikhsan DwiPutra", userType: "MAHASISWA" },
  { username: "2113231110", name: "Iqbal Muhammad Yanuar", userType: "MAHASISWA" },
  { username: "2113231026", name: "Adrian Nuryana", userType: "MAHASISWA" },
  { username: "2113231076", name: "Muhamad Sauzan Rizki Asakir", userType: "MAHASISWA" },
  { username: "2113231142", name: "Erlangga Yuda Pratama", userType: "MAHASISWA" },
  { username: "2113231134", name: "Shula Khalid Mauliawan", userType: "MAHASISWA" },
  { username: "2113231092", name: "Muhamad Gilang Rizqy Suryana", userType: "MAHASISWA" },
  { username: "2113231036", name: "Rummy Ramzha Ramadhan", userType: "MAHASISWA" },

  // 22 mahasiswa acak
  { username: "2113231012", name: "Aulia Rahmawati", userType: "MAHASISWA" },
  { username: "2113231018", name: "Bayu Prasetyo", userType: "MAHASISWA" },
  { username: "2113231029", name: "Citra Maharani", userType: "MAHASISWA" },
  { username: "2113231033", name: "Dimas Aditya Nugroho", userType: "MAHASISWA" },
  { username: "2113231041", name: "Eka Putri Lestari", userType: "MAHASISWA" },
  { username: "2113231047", name: "Fajar Ramadhan", userType: "MAHASISWA" },
  { username: "2113231052", name: "Gita Savitri Dewi", userType: "MAHASISWA" },
  { username: "2113231058", name: "Hafidz Alfarizi", userType: "MAHASISWA" },
  { username: "2113231063", name: "Intan Permatasari", userType: "MAHASISWA" },
  { username: "2113231067", name: "Joko Santoso", userType: "MAHASISWA" },
  { username: "2113231071", name: "Kirana Anggraeni", userType: "MAHASISWA" },
  { username: "2113231079", name: "Lutfi Hakim", userType: "MAHASISWA" },
  { username: "2113231088", name: "Maya Salsabila", userType: "MAHASISWA" },
  { username: "2113231095", name: "Naufal Hidayat", userType: "MAHASISWA" },
  { username: "2113231101", name: "Okta Nurfadilah", userType: "MAHASISWA" },
  { username: "2113231106", name: "Putri Ayu Wulandari", userType: "MAHASISWA" },
  { username: "2113231115", name: "Rafi Maulana Akbar", userType: "MAHASISWA" },
  { username: "2113231121", name: "Salsa Nabila Putri", userType: "MAHASISWA" },
  { username: "2113231127", name: "Tegar Wicaksono", userType: "MAHASISWA" },
  { username: "2113231133", name: "Ulfa Khoerunnisa", userType: "MAHASISWA" },
  { username: "2113231138", name: "Vina Oktaviani", userType: "MAHASISWA" },
  { username: "2113231149", name: "Yoga Pratama Putra", userType: "MAHASISWA" },
];

export const dosen: SeedUser[] = [
  { username: "0411058501", name: "Dr. Ahmad Fauzi, M.Kom.", userType: "DOSEN" },
  { username: "0415078802", name: "Dr. Rina Kartika Sari, M.T.", userType: "DOSEN" },
  { username: "0408047503", name: "Prof. Dr. Hendra Wijaya, M.Sc.", userType: "DOSEN" },
  { username: "0420129004", name: "Siti Nurhaliza, S.Kom., M.Cs.", userType: "DOSEN" },
  { username: "0403068205", name: "Bambang Hermawan, S.T., M.T.", userType: "DOSEN" },
];