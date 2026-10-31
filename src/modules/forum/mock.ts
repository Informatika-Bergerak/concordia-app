import type { FeedPost } from "./types";

export const mockFeed: FeedPost[] = [
  {
    id: "p1",
    authorName: "Erlangga Y P",
    authorMajor: "Teknik Informatika",
    timeAgo: "2 jam yang lalu",
    text: "Yang ngerasa ketuker sepatu di sc lantai 3 kabarin 😊",
    tag: "BARANG HILANG",
    hasImage: true,
    likes: 100,
    commentCount: 5,
    comments: [
      { id: "c1", authorName: "Isan Wibu", timeAgo: "5 Jam Yang Lalu", text: "Jangankan sepatu sendal aja gw gapunya bang" },
      { id: "c2", authorName: "Shula Khalid", timeAgo: "2 Jam Yang Lalu", text: "Punya gua itu bang, pantesan ngerasa seseg ni kaki" },
    ],
  },
  {
    id: "p2",
    authorName: "Gilang Uber",
    authorMajor: "Teknik Informatika",
    timeAgo: "5 jam yang lalu",
    text: "Info Kehilangan Dompet, kalau ga ada yang ngaku mau saya bawa",
    tag: "BARANG HILANG",
    hasImage: true,
    likes: 42,
    commentCount: 1,
    comments: [
      { id: "c3", authorName: "Adrian Nuryana", timeAgo: "3 Jam Yang Lalu", text: "Cek ke pos satpam dulu bang" },
    ],
  },
  {
    id: "p3",
    authorName: "Rummy Ramzha",
    authorMajor: "Teknik Informatika",
    timeAgo: "1 hari yang lalu",
    text: "Ada yang tau dosen pengganti kelas Basis Data hari ini?",
    tag: "INFO KULIAH",
    hasImage: false,
    likes: 17,
    commentCount: 0,
    comments: [],
  },
];