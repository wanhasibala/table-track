"use client";
import { useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

export default function CartPageRedirect() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const slug = params.slug;
    const tableId = searchParams.get("tableId") || searchParams.get("table_id") || "new-order";
    
    if (slug) {
      const isSubdomain = typeof window !== "undefined" && window.location.hostname.includes(slug as string);
      if (isSubdomain) {
        const targetPath = tableId === "new-order" ? "/" : `/${tableId}`;
        router.replace(targetPath);
      } else {
        router.replace(`/order/${slug}/${tableId}`);
      }
    }
  }, [router, params, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
