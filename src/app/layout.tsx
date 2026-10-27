// @ts-expect-error CSS side-effect imports are handled by Next.js.
import "@/styles/app.css";

export const metadata = {
  title: "ConCordia",
  description: "Aplikasi web ConCordia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}