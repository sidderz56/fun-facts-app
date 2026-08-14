import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { siteUrl } from "@/lib/siteUrl";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Fun Facts",
  description: "A genuinely surprising fun fact in as few taps as possible.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} h-full antialiased`}>
      <head>
        {/* Noto Sans Tibetan isn't in next/font/google's supported manifest,
            so it's loaded the standard way — only used for the Tibetan
            "hello" text inside the Words & Language icon. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font --
            this rule targets the Pages Router's _document.js; in App Router,
            root layout.tsx's <head> is the correct place for a font that
            should apply to every route. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tibetan:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
