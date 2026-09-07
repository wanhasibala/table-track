import React, { Suspense } from "react";
import { Metadata } from "next";
import OrderMenuPage from "./[tableId]/order";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const formattedName = slug
    ? slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Restoran";

  return {
    title: `Menu Digital & Pesan Online | ${formattedName}`,
    description: `Lihat daftar menu digital dan pesan langsung dari meja di ${formattedName} melalui sistem Nata QR Order.`,
    openGraph: {
      title: `Menu Digital & Pesan Online | ${formattedName}`,
      description: `Pindai menu dan pesan langsung dari meja di ${formattedName}. Cepat, praktis, dan tanpa antre.`,
      locale: "id_ID",
      type: "website",
    },
  };
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
          Memuat menu restoran...
        </div>
      }
    >
      <OrderMenuPage />
    </Suspense>
  );
}
