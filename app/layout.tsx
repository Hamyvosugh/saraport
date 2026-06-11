import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saraport | ساراپورت",
  description: "دستیار سلامت و رژیم غذایی هوشمند",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}