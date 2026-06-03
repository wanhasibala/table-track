import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
//@ts-ignore
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

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

export const metadata: Metadata = {
  title: {
    default: "Table Track",
    template: "%s | Table Track",
  },
  description:
    "Table Track is ready for offline use after the app has loaded once.",
  // manifest: "/manifest.webmanifest",
  // themeColor: "#B45309",
  appleWebApp: {
    capable: true,
    title: "Table Track",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className}  antialiased`}>
        <PwaRegister />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-right"/>
      </body>
    </html>
  );
}
