import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/next'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "RSM Pillar Two Initial Scoping Readiness Assessment",
  description:
    "RSM Pillar Two Initial Scoping Readiness Assessment helps organizations determine whether their MNE Group is subject to the UAE Domestic Minimum Top-up Tax (DMTT) / Pillar Two Rules and identify key scoping considerations.",
  openGraph: {
    images: [
      {
        url: "https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm_592baa45-bdc5-429c-91d1-61f6c8ee8753.webp",
        width: 1920,
        height: 540,
        alt: "RSM Pillar Two Initial Scoping Readiness Assessment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      "https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm_592baa45-bdc5-429c-91d1-61f6c8ee8753.webp",
    ],
  },
  icons: {
    icon: "https://cdn-nexlink.s3.us-east-2.amazonaws.com/Faviconn_2d471e30-d53d-4c59-bc9e-4ae17baa0a92.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
      <GoogleAnalytics gaId="G-1NXS62CTQ7" />
    </html>
  );
}
