import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteChrome from "@/components/SiteChrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thread & Form",
  description:
    "Well-made clothing essentials, cut for everyday. Shop the latest collections at Thread & Form.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
      <SiteChrome>{children}</SiteChrome>
    </body>
    </html>
  );
}
