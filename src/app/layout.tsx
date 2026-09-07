import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
//@ts-ignore
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Providers } from "@/store/provider";
import { JsonLd } from "@/components/seo/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nata.id";

export const viewport: Viewport = {
  themeColor: "#b45309",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nata - Aplikasi Menu QR & POS Kasir Restoran untuk UMKM Indonesia",
    template: "%s | Nata - Menu QR & POS Resto UMKM",
  },
  description:
    "Solusi self-ordering menu digital QR code meja dan POS kasir restoran untuk UMKM kuliner, cafe, resto, dan kedai kopi di Indonesia. Pesan langsung dari meja, terhubung ke dapur realtime, dan dukung pembayaran QRIS.",
  keywords: [
    "aplikasi kasir restoran",
    "menu qr code indonesia",
    "self ordering resto",
    "pos umkm kuliner",
    "aplikasi pesan makanan dari meja",
    "menu digital cafe",
    "aplikasi kasir cafe murah",
    "aplikasi f&b indonesia",
    "kitchen display system indonesia",
    "qris restoran",
    "sistem kasir kedai kopi",
    "aplikasi kasir rumah makan",
  ],
  authors: [{ name: "Nata Indonesia", url: siteUrl }],
  creator: "Nata Indonesia",
  publisher: "Nata Indonesia",
  applicationName: "Nata",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "id-ID": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Nata - Menu QR & POS Restoran UMKM Indonesia",
    title: "Nata - Aplikasi Menu QR & Kasir Digital Restoran UMKM Indonesia",
    description:
      "Tingkatkan omset dan percepat perputaran meja resto/cafe Anda. Pelanggan cukup scan QR di meja untuk memesan, langsung masuk ke dapur & kasir secara realtime.",
    images: [
      {
        url: "/apple-touch-icon.png",
        width: 512,
        height: 512,
        alt: "Nata - Solusi Menu QR & POS Kasir UMKM Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nata - Aplikasi Menu QR & POS Kasir Restoran UMKM Indonesia",
    description:
      "Solusi self-ordering menu QR code meja & kasir digital untuk restoran, cafe, kedai kopi, dan UMKM kuliner Indonesia.",
    images: ["/apple-touch-icon.png"],
    creator: "@nata_app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: "Nata POS",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <JsonLd />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <PwaRegister />
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
