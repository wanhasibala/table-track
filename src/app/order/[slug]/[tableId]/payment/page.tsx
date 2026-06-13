"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function PaymentPageRedirect() {
  const router = useRouter();
  const params = useParams();
  
  useEffect(() => {
    if (params.slug && params.tableId) {
      router.replace(`/order/${params.slug}/${params.tableId}`);
    }
  }, [router, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
