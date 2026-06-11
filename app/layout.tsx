import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://saraport.vercel.app"),
  title: "Saraport | ساراپورت",
  description: "دستیار سلامت و رژیم غذایی هوشمند",
  openGraph: {
    title: "Saraport | ساراپورت",
    description: "دستیار سلامت و رژیم غذایی هوشمند",
    images: [
      {
        url: "/images/graph.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saraport | ساراپورت",
    description: "دستیار سلامت و رژیم غذایی هوشمند",
    images: ["/images/graph.png"],
  },
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