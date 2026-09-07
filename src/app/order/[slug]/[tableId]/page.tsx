import React, { Suspense } from "react";
import { Metadata } from "next";
import OrderMenuPage from "./order";

type Props = {
  params: Promise<{ slug: string; tableId: string }>;
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
    title: `Pesan dari Meja | ${formattedName}`,
    description: `Pesan menu hidangan dan minuman langsung dari meja di ${formattedName} lewat Nata.`,
    robots: {
      index: false, // Prevent search engines from indexing specific table session order links to avoid duplicate content
      follow: true,
    },
  };
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
          Memuat menu meja...
        </div>
      }
    >
      <OrderMenuPage />
    </Suspense>
  );
}