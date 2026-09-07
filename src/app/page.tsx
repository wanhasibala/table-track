"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  QrCode,
  UtensilsCrossed,
  Smartphone,
  BellRing,
  Globe2,
  ShieldCheck,
  Clock,
  Utensils,
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  Star,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Receipt,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MockProduct {
  id: string;
  name: string;
  price: number;
  priceFormatted: string;
  category: string;
  image: string;
  rating: number;
  description: string;
}

const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "1",
    name: "Nasi Goreng Spesial Nata",
    price: 28000,
    priceFormatted: "Rp 28.000",
    category: "Makanan Utama",
    image: "🍳",
    rating: 4.9,
    description: "Nasi goreng bumbu rempah dengan telur mata sapi & ayam suwir",
  },
  {
    id: "2",
    name: "Ayam Geprek Sambal Matah",
    price: 25000,
    priceFormatted: "Rp 25.000",
    category: "Makanan Utama",
    image: "🍗",
    rating: 4.8,
    description: "Ayam crispy gurih dengan taburan sambal matah segar khas Bali",
  },
  {
    id: "3",
    name: "Kentang Goreng Truffle",
    price: 20000,
    priceFormatted: "Rp 20.000",
    category: "Camilan",
    image: "🍟",
    rating: 4.9,
    description: "French fries renyah dengan taburan keju parmesan & aroma truffle",
  },
  {
    id: "4",
    name: "Es Kopi Susu Gula Aren",
    price: 18000,
    priceFormatted: "Rp 18.000",
    category: "Minuman",
    image: "☕",
    rating: 4.9,
    description: "Espresso robusta-arabika berpadu susu creamy & gula aren murni",
  },
  {
    id: "5",
    name: "Matcha Iced Latte Creamy",
    price: 22000,
    priceFormatted: "Rp 22.000",
    category: "Minuman",
    image: "🍵",
    rating: 4.7,
    description: "Matcha premium khas Jepang berpadu susu segar dingin",
  },
];

const FAQS = [
  {
    q: "Apa itu Nata dan bagaimana cara kerjanya untuk restoran / kafe?",
    a: "Nata adalah platform menu digital QR code dan sistem kasir POS yang memungkinkan pengunjung memesan dan membayar langsung dari meja makan mereka lewat HP tanpa perlu mengunduh aplikasi tambahan. Pesanan otomatis masuk ke dapur (Kitchen Display) dan kasir secara real-time.",
  },
  {
    q: "Apakah pelanggan harus mengunduh (download) aplikasi terlebih dahulu?",
    a: "Tidak sama sekali! Pelanggan cukup membuka kamera smartphone dan scan QR code di meja. Menu interaktif langsung terbuka di browser web HP pelanggan secara cepat, ringan, dan responsif.",
  },
  {
    q: "Apakah Nata cocok untuk UMKM kuliner skala kecil dan kedai kopi?",
    a: "Sangat cocok. Nata dirancang khusus untuk memenuhi kebutuhan UMKM kuliner di Indonesia — mulai dari warung makan modern, kedai kopi/cafe, food court, hingga restoran dengan banyak meja. Biayanya sangat terjangkau tanpa ada potongan komisi per transaksi.",
  },
  {
    q: "Bagaimana sistem pembayarannya? Apakah mendukung QRIS?",
    a: "Nata mendukung fleksibilitas pembayaran penuh: pelanggan dapat langsung membayar via QRIS/e-Wallet secara online, atau memilih opsi bayar tunai / kartu di kasir setelah selesai bersantap.",
  },
  {
    q: "Bagaimana cara mencetak QR Code untuk setiap nomor meja?",
    a: "Melalui dashboard Nata, Anda dapat membuat dan mengunduh QR Code beresolusi tinggi untuk setiap meja (Meja 1, Meja 2, Area VIP, dll.) dengan satu klik, siap cetak dan ditempel di meja restoran Anda.",
  },
];

export default function LandingPage() {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState("Makanan Utama");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[id] <= 1) {
        delete updated[id];
      } else {
        updated[id]--;
      }
      return updated;
    });
  };

  const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = MOCK_PRODUCTS.find((p) => p.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Top Banner Notice for Indonesian UMKM */}
      <div className="bg-primary/10 border-b border-primary/20 text-primary text-xs py-2 px-4 text-center font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5" />
          <span>
            Solusi Digitalisasi UMKM Kuliner Indonesia • Coba Gratis 14 Hari
            Tanpa Komisi Transaksi!
          </span>
        </span>
      </div>

      {/* Header/Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/apple-touch-icon.png"
              alt="Nata Logo - Aplikasi Menu QR & POS Kasir Restoran UMKM"
              width={32}
              height={32}
              className="rounded-lg shadow-sm group-hover:scale-105 transition-all"
            />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-foreground leading-none">
                Nata
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Menu QR & POS UMKM
              </span>
            </div>
          </Link>

          <nav
            className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground"
            aria-label="Navigasi Utama"
          >
            <a href="#fitur" className="hover:text-primary transition-colors">
              Fitur Utama
            </a>
            <a href="#demo" className="hover:text-primary transition-colors">
              Simulasi Menu QR
            </a>
            <a href="#keunggulan" className="hover:text-primary transition-colors">
              Untuk Siapa?
            </a>
            <a href="#harga" className="hover:text-primary transition-colors">
              Harga Paket
            </a>
            <a href="#faq" className="hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-full shadow-md transition-all hover:-translate-y-0.5"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section
          className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-12 gap-12 items-center"
          aria-labelledby="hero-heading"
        >
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <TrendingUp className="size-3.5" />
              <span>Aplikasi Kasir & Self-Ordering #1 untuk UMKM F&B</span>
            </div>
            <h1
              id="hero-heading"
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight"
            >
              Menu QR Meja & Kasir Restoran untuk{" "}
              <span className="text-primary bg-clip-text">UMKM Indonesia</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Tingkatkan perputaran meja (table turnover), kurangi antrean
              panjang di kasir, dan mudahkan pelanggan memesan langsung dari HP
              mereka. Pesanan otomatis terhubung ke dapur secara real-time.
            </p>

            <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="size-3.5 text-green-600" /> Tanpa
                Komisi Transaksi
              </span>
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="size-3.5 text-green-600" /> Tanpa Perlu
                Download Aplikasi
              </span>
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="size-3.5 text-green-600" /> Dukung QRIS
                & Kasir
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link
                href="/auth/register"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-8 py-4 rounded-full shadow-lg shadow-primary/10 text-base transition-all hover:-translate-y-0.5"
              >
                Mulai Uji Coba Gratis 14 Hari
              </Link>
              <a
                href="#demo"
                className="flex items-center justify-center gap-2 border border-input bg-background hover:bg-accent text-accent-foreground font-semibold px-8 py-4 rounded-full transition-all"
              >
                Coba Simulasi Menu QR
              </a>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-[310px] h-[610px] bg-card rounded-[40px] p-3.5 border-4 border-border shadow-2xl relative overflow-hidden flex flex-col justify-between">
              {/* Camera notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-4 bg-background border border-border rounded-full z-20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-muted rounded-full" />
              </div>

              {/* Mobile UI Screen Mock */}
              <div className="flex-1 bg-background rounded-[30px] p-4 pt-6 overflow-y-auto space-y-4 no-scrollbar">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                      MEJA NOMOR: A3
                    </span>
                    <h3 className="font-bold text-sm text-foreground">
                      Kedai Kopi Nusantara
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    KN
                  </div>
                </div>

                {/* Banner Promo */}
                <div className="bg-primary text-primary-foreground rounded-xl p-3 space-y-1">
                  <span className="text-[9px] font-mono tracking-wider font-semibold uppercase bg-black/20 px-1.5 py-0.5 rounded">
                    PROMO SPESIAL
                  </span>
                  <h4 className="font-bold text-xs">Diskon 15% Paket Makan Siang</h4>
                  <p className="text-[9px] text-primary-foreground/90">
                    Otomatis berlaku untuk pemesanan dine-in hari ini
                  </p>
                </div>

                {/* Categories */}
                <div className="flex gap-2 text-[10px] font-semibold overflow-x-auto pb-1">
                  <span className="bg-primary text-primary-foreground px-2.5 py-1 rounded-full whitespace-nowrap">
                    Makanan Utama
                  </span>
                  <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full whitespace-nowrap">
                    Camilan
                  </span>
                  <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full whitespace-nowrap">
                    Kopi & Minuman
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <div className="bg-card border border-border rounded-xl p-2.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-xs text-card-foreground">
                        Nasi Goreng Spesial
                      </h5>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        Rp 28.000
                      </p>
                    </div>
                    <span className="bg-primary text-primary-foreground rounded-lg px-2 py-1 text-xs font-bold">
                      + Tambah
                    </span>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-2.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-xs text-card-foreground">
                        Es Kopi Gula Aren
                      </h5>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        Rp 18.000
                      </p>
                    </div>
                    <span className="bg-primary text-primary-foreground rounded-lg px-2 py-1 text-xs font-bold">
                      + Tambah
                    </span>
                  </div>
                </div>

                {/* Live Status Tracker widget */}
                <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <Clock className="size-3" /> Pesanan #042
                    </span>
                    <span className="text-muted-foreground font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Sedang Dimasak di Dapur
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full w-[70%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section
          id="fitur"
          className="max-w-7xl mx-auto px-6 py-20 border-t border-border relative"
          aria-labelledby="features-heading"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">
              FITUR LENGKAP & PRAKTIS
            </span>
            <h2
              id="features-heading"
              className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
            >
              Semua Kebutuhan Restoran & Cafe dalam Satu Platform
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Dari meja makan, layar dapur, hingga kasir, Nata mengotomatiskan
              alur pemesanan resto Anda agar lebih cepat, rapi, dan bebas salah
              catat.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <article className="border border-border bg-card/60 p-6 rounded-2xl space-y-4 hover:border-primary/30 hover:bg-accent/30 transition-all duration-300">
              <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                <QrCode className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Generator QR Meja Siap Cetak
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Buat dan unduh QR code unik untuk tiap meja dalam resolusi
                tinggi. Cukup cetak dan tempel di meja makan atau area bar.
              </p>
            </article>

            {/* Card 2 */}
            <article className="border border-border bg-card/60 p-6 rounded-2xl space-y-4 hover:border-primary/30 hover:bg-accent/30 transition-all duration-300">
              <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                <BellRing className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Notifikasi Dapur Real-Time (KDS)
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Begitu pelanggan mengirim pesanan, layar dapur langsung berbunyi
                dan menampilkan rincian menu. Koki bisa langsung memasak tanpa
                menunggu pelayan.
              </p>
            </article>

            {/* Card 3 */}
            <article className="border border-border bg-card/60 p-6 rounded-2xl space-y-4 hover:border-primary/30 hover:bg-accent/30 transition-all duration-300">
              <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Pembayaran QRIS & Kasir Fleksibel
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Pelanggan bisa membayar langsung dengan QRIS / e-Wallet dari meja
                atau memilih metode bayar tunai / debit di kasir.
              </p>
            </article>

            {/* Card 4 */}
            <article className="border border-border bg-card/60 p-6 rounded-2xl space-y-4 hover:border-primary/30 hover:bg-accent/30 transition-all duration-300">
              <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                <Receipt className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Manajemen Menu & Stok Habis
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ubah harga, tambah varian (level pedas, pilihan topping), atau
                tandai menu habis secara instan langsung dari HP Anda.
              </p>
            </article>

            {/* Card 5 */}
            <article className="border border-border bg-card/60 p-6 rounded-2xl space-y-4 hover:border-primary/30 hover:bg-accent/30 transition-all duration-300">
              <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                <Globe2 className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Custom Domain & Branding Cafe
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Gunakan nama brand restoran Anda sendiri (misal:{" "}
                <code className="text-primary font-semibold">
                  menu.kopinusantara.id
                </code>
                ) untuk pengalaman yang lebih profesional.
              </p>
            </article>

            {/* Card 6 */}
            <article className="border border-border bg-card/60 p-6 rounded-2xl space-y-4 hover:border-primary/30 hover:bg-accent/30 transition-all duration-300">
              <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                <Smartphone className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Aplikasi PWA Ringan & Offline Support
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Loading cepat bahkan saat koneksi lambat. Dapat diinstall di HP
                kasir atau tablet pelayan tanpa perlu perangkat mahal.
              </p>
            </article>
          </div>
        </section>

        {/* Target Audience / Use Cases */}
        <section
          id="keunggulan"
          className="bg-muted/30 border-y border-border py-20"
          aria-labelledby="usecases-heading"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                COCOK UNTUK BERBAGAI JENIS USAHA KULINER
              </span>
              <h2
                id="usecases-heading"
                className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
              >
                Dirancang untuk Membantu UMKM F&B Bertumbuh
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Apapun model bisnis kuliner Anda di Indonesia, Nata siap
                membantu meningkatkan efisiensi operasional harian.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Coffee className="size-5" />
                </div>
                <h3 className="font-bold text-foreground text-base">
                  Kafe & Kedai Kopi
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pelanggan santai memilih varian beans, susu, dan gula aren
                  tanpa harus mengantre di kasir.
                </p>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UtensilsCrossed className="size-5" />
                </div>
                <h3 className="font-bold text-foreground text-base">
                  Restoran & Rumah Makan
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Otomatisasi pesanan untuk puluhan meja sekaligus, koki menerima
                  instruksi masak tanpa salah catat.
                </p>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Utensils className="size-5" />
                </div>
                <h3 className="font-bold text-foreground text-base">
                  Food Court & Pujasera
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pemesanan terpusat dari satu QR code meja untuk kemudahan
                  pengunjung menikmati aneka hidangan.
                </p>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp className="size-5" />
                </div>
                <h3 className="font-bold text-foreground text-base">
                  Warung Modern & Fast Casual
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Percepat perputaran pelanggan saat jam makan siang yang ramai
                  dengan self-ordering instan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Mobile Ordering Simulator */}
        <section
          id="demo"
          className="py-20 relative max-w-7xl mx-auto px-6"
          aria-labelledby="demo-heading"
        >
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Smartphone className="size-3.5" />
                <span>Simulasi Interaktif Pelanggan</span>
              </div>
              <h2
                id="demo-heading"
                className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight"
              >
                Coba Langsung Pengalaman Pelanggan Scan Menu QR
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Lihat betapa mudahnya pelanggan Anda memilih menu, menambah
                catatan, dan melihat total tagihan secara instan langsung dari
                tampilan simulasi smartphone di samping.
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Pilih Menu Favorit
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Pelanggan memilih kategori hidangan dan mengetuk tombol
                      tambah.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Atur Jumlah & Catatan Menu
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Tambah varian atau ubah porsi langsung tanpa perlu
                      memanggil pelayan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Kirim Pesanan Langsung ke Dapur
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Pesanan langsung diproses tanpa risiko salah dengar atau
                      lupa dicatat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SIMULATOR DEVICE CONTAINER */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-[340px] h-[640px] bg-card rounded-[44px] p-4 border-[6px] border-border shadow-2xl relative overflow-hidden flex flex-col justify-between">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-5 bg-background border border-border rounded-full z-20 flex items-center justify-center">
                  <div className="w-3 h-3 bg-muted rounded-full mr-2" />
                  <div className="w-1.5 h-1.5 bg-muted rounded-full" />
                </div>

                {/* Mobile Live Screen */}
                <div className="flex-1 bg-background rounded-[32px] p-4 pt-8 overflow-y-auto space-y-4 flex flex-col justify-between select-none no-scrollbar">
                  {/* Header info */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                          Dine-In • Meja Nomor B-04
                        </span>
                        <h4 className="text-sm font-black text-foreground">
                          Warung Steak & Kopi UMKM
                        </h4>
                      </div>
                      <Heart className="size-4 text-red-500 fill-red-500/10" />
                    </div>

                    {/* Search bar simulation */}
                    <div className="bg-muted rounded-full px-3 py-2 text-xs text-muted-foreground flex items-center justify-between border border-border">
                      <span>Cari nasi goreng, es kopi...</span>
                      <Utensils className="size-3.5" />
                    </div>

                    {/* Menu filters */}
                    <div className="flex gap-2 pb-1 overflow-x-auto text-[10px] font-bold">
                      {["Makanan Utama", "Camilan", "Minuman"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={cn(
                            "px-3 py-1.5 rounded-full transition-all border whitespace-nowrap cursor-pointer",
                            activeCategory === cat
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-muted border-border text-muted-foreground",
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Product Lists matching Category */}
                    <div className="space-y-2.5">
                      {MOCK_PRODUCTS.filter(
                        (p) => p.category === activeCategory,
                      ).map((product) => {
                        const qty = cart[product.id] || 0;
                        return (
                          <div
                            key={product.id}
                            className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 hover:border-primary/20 transition-all"
                          >
                            <div className="text-2xl w-11 h-11 bg-muted border border-border rounded-full flex items-center justify-center shrink-0">
                              {product.image}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <h5 className="font-bold text-xs text-card-foreground truncate">
                                  {product.name}
                                </h5>
                                <span className="text-[10px] font-bold text-primary shrink-0">
                                  {product.priceFormatted}
                                </span>
                              </div>
                              <p className="text-[9px] text-muted-foreground truncate">
                                {product.description}
                              </p>
                              <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center gap-1">
                                  <Star className="size-2.5 fill-amber-500 text-amber-500" />
                                  <span className="text-[9px] text-muted-foreground font-semibold">
                                    {product.rating}
                                  </span>
                                </div>

                                {/* Quantity control */}
                                {qty > 0 ? (
                                  <div className="flex items-center gap-2 bg-background rounded-lg p-0.5 border border-border">
                                    <button
                                      onClick={() => removeFromCart(product.id)}
                                      className="p-1 text-muted-foreground hover:text-foreground rounded"
                                      aria-label="Kurangi porsi"
                                    >
                                      <Minus className="size-2.5" />
                                    </button>
                                    <span className="text-[10px] font-bold text-foreground px-1">
                                      {qty}
                                    </span>
                                    <button
                                      onClick={() => addToCart(product.id)}
                                      className="p-1 text-muted-foreground hover:text-foreground rounded"
                                      aria-label="Tambah porsi"
                                    >
                                      <Plus className="size-2.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(product.id)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                                  >
                                    + Tambah
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtotal overlay footer */}
                  <div className="mt-4 border-t border-border pt-3">
                    {cartTotalItems > 0 ? (
                      <button className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-full flex items-center justify-between text-xs font-bold shadow-lg cursor-pointer">
                        <span className="flex items-center gap-2">
                          <ShoppingBag className="size-4" />
                          <span>Lihat Pesanan ({cartTotalItems})</span>
                        </span>
                        <span>{formatRupiah(cartTotalPrice)}</span>
                      </button>
                    ) : (
                      <div className="text-center py-2 text-[10px] text-muted-foreground">
                        Keranjang kosong. Pilih menu di atas untuk mencoba.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="harga"
          className="max-w-7xl mx-auto px-6 py-24 border-t border-border relative"
          aria-labelledby="pricing-heading"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">
              HARGA RAMAH UMKM
            </span>
            <h2
              id="pricing-heading"
              className="text-3xl md:text-5xl font-black text-foreground tracking-tight"
            >
              Satu Harga Terjangkau. Tanpa Potongan Komisi.
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Tidak ada bagi hasil atau potongan per transaksi pesanan Anda.
              Nikmati 100% pendapatan usaha Anda seutuhnya.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="border-2 border-primary bg-card p-8 rounded-3xl w-full max-w-md relative overflow-hidden shadow-xl shadow-primary/5">
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Paling Diminati UMKM
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-foreground">
                  Paket Langganan UMKM Juara
                </h3>
                <p className="text-muted-foreground text-sm">
                  Solusi komplit untuk kafe, resto, warung makan, dan kedai
                  kopi modern di Indonesia.
                </p>
                <div className="py-4 flex items-baseline gap-1.5 text-foreground">
                  <span className="text-4xl font-black tracking-tight text-primary">
                    Rp 99.000
                  </span>
                  <span className="text-sm text-muted-foreground">/ bulan</span>
                </div>
              </div>

              <hr className="border-border my-6" />

              <div className="space-y-4 mb-8 text-foreground">
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="size-5 text-primary shrink-0" />
                  <span>
                    <strong>Unlimited</strong> Menu & Kategori Makanan/Minuman
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="size-5 text-primary shrink-0" />
                  <span>
                    <strong>Unlimited</strong> Cetak QR Code Meja Nomor Resto
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="size-5 text-primary shrink-0" />
                  <span>
                    <strong>Kitchen Display System</strong> dengan Notifikasi
                    Bunyi
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="size-5 text-primary shrink-0" />
                  <span>
                    <strong>Integrasi QRIS & Kasir</strong> Pembayaran Bebas
                    Ribet
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="size-5 text-primary shrink-0" />
                  <span>
                    <strong>Laporan Omset & Rekap Harian</strong> Otomatis
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="size-5 text-primary shrink-0" />
                  <span>
                    <strong>Support Akses Offline</strong> & Aplikasi Ringan PWA
                  </span>
                </div>
              </div>

              <Link
                href="/auth/register"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-6 rounded-full flex items-center justify-center shadow-lg transition-all hover:-translate-y-0.5 text-base"
              >
                Coba Gratis 14 Hari Sekarang
              </Link>
              <p className="text-center text-[11px] text-muted-foreground mt-3">
                Tanpa perlu kartu kredit • Batal kapan saja
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="bg-muted/30 border-t border-border py-20"
          aria-labelledby="faq-heading"
        >
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center space-y-3 mb-14">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                PERTANYAAN UMUM
              </span>
              <h2
                id="faq-heading"
                className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
              >
                Pertanyaan yang Sering Diajukan Pemilik Usaha
              </h2>
              <p className="text-muted-foreground text-sm">
                Pelajari selengkapnya tentang bagaimana Nata membantu restoran
                dan cafe Anda berjalan lebih otomatis.
              </p>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() =>
                      setOpenFaq(openFaq === index ? null : index)
                    }
                    className="w-full px-6 py-4 text-left font-bold text-sm md:text-base text-foreground flex items-center justify-between gap-4 cursor-pointer hover:text-primary transition-colors"
                    aria-expanded={openFaq === index}
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="size-4 text-primary shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
                        openFaq === index && "rotate-180 text-primary",
                      )}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight max-w-3xl mx-auto leading-tight">
              Siap Menjadikan Resto & Kafe Anda Lebih Modern & Ramai?
            </h2>
            <p className="text-primary-foreground/90 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Bergabunglah bersama ratusan pemilik UMKM kuliner di Indonesia yang
              telah mempercepat pemesanan meja dan melipatgandakan kepuasan
              pelanggan bersama Nata.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center bg-background text-foreground hover:bg-background/90 font-bold px-8 py-4 rounded-full shadow-lg text-base transition-all hover:scale-105"
              >
                Daftar & Pasang Menu QR Sekarang
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12 text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/apple-touch-icon.png"
              alt="Nata Logo"
              width={24}
              height={24}
              className="rounded-md"
            />
            <span className="text-base font-bold text-foreground">
              Nata Indonesia
            </span>
          </div>

          <p className="text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} Nata. Platform Menu QR Code & POS
            Kasir Restoran UMKM Indonesia.
          </p>

          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link
              href="/auth/login"
              className="hover:text-foreground transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/auth/register"
              className="hover:text-foreground transition-colors"
            >
              Daftar
            </Link>
            <a
              href="mailto:support@nata.id"
              className="hover:text-foreground transition-colors"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
