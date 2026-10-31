import { Nunito } from "next/font/google";
import "@/styles/tokens.css";
import "@/styles/app.css";

const nunito = Nunito({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

export const metadata = {
  title: "ConCordia",
  description: "Aplikasi web ConCordia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={nunito.variable}>
      <body>{children}</body>
    </html>
  );
}