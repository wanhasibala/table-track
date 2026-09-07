import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nata - Aplikasi Menu QR & POS Kasir Restoran UMKM",
    short_name: "Nata",
    description:
      "Aplikasi Self-Ordering Menu QR Code Meja & POS Kasir Restoran untuk UMKM Kuliner Indonesia.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b45309",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
