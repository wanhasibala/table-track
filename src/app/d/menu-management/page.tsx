"use client";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import React, { useMemo, useState } from "react";
import { column } from "./menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MenuForm } from "./menu-form";
import { useGetResourceQuery, useGetResourceByIdQuery } from "@/store/services/flexible-querry";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChefHat } from "lucide-react";
import { toast } from "sonner";

const getImages = (imageUrl: unknown): string[] => {
  if (!imageUrl) return [];
  if (Array.isArray(imageUrl)) {
    return imageUrl.length > 0 ? imageUrl : [];
  }
  if (typeof imageUrl === "string") {
    if (imageUrl.startsWith("[")) {
      try {
        const parsed = JSON.parse(imageUrl);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [imageUrl];
  }
  return [];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const Page = () => {
  const columns = column();
  const [dialog, setDialog] = useState({
    open: false,
    id: "",
  });
  const { data, refetch } = useGetResourceQuery({
    resource: "menu_item",
    params: {
      select: "*, category(name)",
    },
  });
  
  // Get active tenant subscription tier
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const tenantId = user?.tenant_id;
  
  const { data: tenantData } = useGetResourceByIdQuery(
    { resource: "tenant", id: tenantId! },
    { skip: !tenantId }
  );
  
  const menuData = useMemo(() => {
    return (
      data?.data.map((item) => ({
        ...item,
        category: item.category?.name || "",
        available: item.is_available,
      })) || []
    );
  }, [data]);

  return (
    <>
      <h3 className="text-xl font-semibold">Menu Management</h3>
      <AdvancedTable
        columns={columns}
        data={menuData}
        addButton={{
          text: "Add New Menu",
          onClick: () => {
            const tier = tenantData?.data?.subscription_tier || "free";
            if (tier === "free" && menuData.length >= 5) {
              toast.error("You've reached the free tier limit of 5 menu items. Please upgrade to Pro to add more!");
              return;
            }
            setDialog((prev) => ({ ...prev, open: true, id: "new" }));
          },
        }}
        view="list"
        listRender={(data) => {
          const images = getImages(data.image_url);
          const hasImage = images.length > 0;
          const firstImage = hasImage ? images[0] : "";

          return (
            <Card className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden border border-border/80 bg-card/70 backdrop-blur-md flex flex-col h-full relative">
              {/* Image Container */}
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/40 border-b border-border/50">
                {hasImage ? (
                  <img
                    src={firstImage}
                    alt={data.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-primary/10 via-secondary/10 to-accent/10 flex flex-col items-center justify-center text-muted-foreground/50 p-4">
                    <ChefHat className="w-12 h-12 mb-2 stroke-[1.5] text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xs font-medium tracking-wide">
                      No image uploaded
                    </span>
                  </div>
                )}

                {/* Category Badge - Glassmorphism */}
                {data.category && (
                  <div className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] px-2 py-0.5 rounded font-mono font-medium shadow-sm">
                    {data.category}
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded font-semibold border shadow-sm backdrop-blur-md",
                      data.available
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20",
                    )}
                  >
                    {data.available ? "Available" : "Unavailable"}
                  </span>
                </div>

                {/* Multi-photo indicator badge */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-mono font-medium border border-white/5">
                    +{images.length - 1} photos
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                    {data.name}
                  </h4>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    {data.stock > 0 ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Stock: {data.stock}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                        Out of stock
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1">
                  <span className="text-base font-extrabold text-foreground tracking-tight">
                    {formatCurrency(data.price)}
                  </span>
                  <div className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-0.5">
                    Edit Details
                  </div>
                </div>
              </div>
            </Card>
          );
        }}
        row_click={(id) => setDialog({ id: id || "", open: true })}
      />
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogTitle>Edit Menu</DialogTitle>
          <MenuForm
            id={dialog.id}
            onSuccess={() => {
              setDialog((prev) => ({ ...prev, open: false, id: "" }));
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Page;
