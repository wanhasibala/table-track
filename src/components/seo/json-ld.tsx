import React from "react";

export function JsonLd() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Nata - Aplikasi Menu QR & POS Kasir Restoran UMKM",
    operatingSystem: "Web, Android, iOS",
    applicationCategory: "BusinessApplication",
    inLanguage: "id-ID",
    description:
      "Aplikasi self-ordering menu QR code meja dan POS kasir digital untuk UMKM F&B, restoran, kafe, kedai kopi, dan warung makan di Indonesia. Terhubung langsung ke dapur dengan notifikasi real-time dan pembayaran QRIS.",
    offers: {
      "@type": "Offer",
      price: "99000",
      priceCurrency: "IDR",
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "250",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "Menu Digital QR Code Meja Instan",
      "Sistem Kasir POS Real-time",
      "Kitchen Display System (KDS) & Notifikasi Bunyi Dapur",
      "Integrasi Pembayaran QRIS & Non-Tunai",
      "Laporan Penjualan & Rekap Omset Harian",
      "PWA Ringan & Dukungan Akses Offline",
      "Custom Subdomain Branding Resto",
    ],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nata Indonesia",
    url: "https://nata.id",
    logo: "https://nata.id/apple-touch-icon.png",
    description:
      "Platform digitalisasi F&B dan UMKM Indonesia untuk sistem pemesanan mandiri (self-ordering) berbasis QR code dan manajemen kasir restoran.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "ID",
    },
    sameAs: [
      "https://www.instagram.com/nata.app",
      "https://www.linkedin.com/company/nata-indonesia",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Apa itu Nata dan bagaimana cara kerjanya untuk restoran atau kafe?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nata adalah platform menu digital QR code dan sistem kasir restoran yang memudahkan pelanggan memesan dan membayar langsung dari meja menggunakan smartphone tanpa perlu mengunduh aplikasi tambahan. Pesanan akan otomatis terkirim secara real-time ke layar dapur dan kasir.",
        },
      },
      {
        "@type": "Question",
        name: "Apakah pelanggan harus download aplikasi untuk scan menu QR?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tidak. Pelanggan cukup membuka kamera smartphone mereka dan memindai QR code di meja. Menu interaktif langsung terbuka di browser HP pelanggan secara instan dan ringan.",
        },
      },
      {
        "@type": "Question",
        name: "Apakah Nata cocok untuk UMKM kuliner dan kedai kopi kecil?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sangat cocok! Nata dirancang khusus agar mudah digunakan oleh UMKM F&B, warung makan, kedai kopi, kafe modern, hingga restoran multi-meja dengan biaya terjangkau tanpa potongan komisi per transaksi.",
        },
      },
      {
        "@type": "Question",
        name: "Apakah Nata mendukung pembayaran non-tunai seperti QRIS?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ya, Nata terintegrasi dengan payment gateway untuk mendukung pembayaran QRIS, e-Wallet (GoPay, OVO, ShopeePay, DANA), transfer bank, serta opsi bayar langsung di kasir.",
        },
      },
      {
        "@type": "Question",
        name: "Bagaimana cara mencetak QR Code untuk setiap meja?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Dari dashboard Nata, Anda dapat membuat dan mengunduh QR Code meja dengan nomor meja secara otomatis dalam resolusi tinggi yang siap dicetak dan ditempel di meja kasir atau meja makan.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
