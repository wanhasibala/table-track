"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGetResourceByIdQuery } from "@/store/services/flexible-querry";
import { Card } from "@/components/ui/card";
import Header from "./header";
import Sidebar from "./sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Get active tenant details
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const tenantId = user?.tenant_id;

  const { data: tenantData, isLoading: tenantLoading } = useGetResourceByIdQuery(
    { resource: "tenant", id: tenantId! },
    { skip: !tenantId }
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tenant = tenantData?.data;
  const subscriptionTier = tenant?.subscription_tier || "free";

  useEffect(() => {
    if (isMounted && !tenantLoading) {
      if (subscriptionTier !== "pro" && pathname !== "/d/billing") {
        router.push("/d/billing");
      }
    }
  }, [isMounted, tenantLoading, subscriptionTier, pathname, router]);

  if (!isMounted || (tenantLoading && pathname !== "/d/billing")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 bg-slate-950 text-white">
        <Loader2 className="size-8 text-orange-500 animate-spin" />
        <span className="text-muted-foreground">Checking subscription status...</span>
      </div>
    );
  }

  // If not pro and trying to access other dashboard pages, return redirect spinner
  if (subscriptionTier !== "pro" && pathname !== "/d/billing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 bg-slate-950 text-white">
        <Loader2 className="size-8 text-orange-500 animate-spin" />
        <span className="text-muted-foreground">Redirecting to billing...</span>
      </div>
    );
  }

  return (
    <SidebarProvider className="overflow-hidden max-h-[100vh]">
      <div className="flex w-full h-screen overflow-hidden">
        <Sidebar />
        <div className="w-full flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden bg-background p-4">
            <Card className="h-full w-full rounded-md overflow-auto p-2">
              {children}
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
export default Layout;

