"use client";

import React, { useMemo, useState, useEffect } from "react";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import { columnTableSpot } from "./table-spot";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TableForm } from "./table-form";
import { useGetResourceQuery, useGetResourceByIdQuery } from "@/store/services/flexible-querry";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { QrCode, Download, ExternalLink, Loader2 } from "lucide-react";

export default function TableManagementPage() {
  const [dialog, setDialog] = useState({
    open: false,
    id: "",
  });

  // Get active tenant info
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const tenantId = user?.tenant_id;

  const { data: tenantData } = useGetResourceByIdQuery(
    { resource: "tenant", id: tenantId! },
    { skip: !tenantId }
  );
  
  const tenantSlug = tenantData?.data?.slug || "default";
  const columns = useMemo(() => columnTableSpot(tenantSlug), [tenantSlug]);

  const { data, isLoading, refetch } = useGetResourceQuery({
    resource: "table_spot",
  });

  // Helper to determine base domain for QR codes
  const getBaseDomain = () => {
    if (typeof window === "undefined") return "localhost:3000";
    const host = window.location.host; // e.g. "misenary.localhost:3000" or "localhost:3000"
    const parts = host.split(".");
    
    // Check if we are on a subdomain (e.g. dashboard.tabletrack.com or misenary.localhost:3000)
    if (parts.length > 2) {
      return parts.slice(1).join(".");
    }
    if (host.endsWith("localhost:3000") || host.endsWith("localhost")) {
      return "localhost:3000";
    }
    return host;
  };

  const downloadQr = async (tableName: string, qrUrl: string) => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `QR_${tableName.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded QR Code for ${tableName}`);
    } catch (err) {
      console.error("Failed to download QR code:", err);
      // Fallback
      window.open(qrUrl, "_blank");
    }
  };

  const tableSpots = useMemo(() => {
    return data?.data || [];
  }, [data]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Table Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage physical tables in your restaurant.</p>
        </div>
      </div>

      <AdvancedTable
        columns={columns}
        data={tableSpots}
        addButton={{
          text: "Add Table Spot",
          onClick: () => {
            const tier = tenantData?.data?.subscription_tier || "free";
            if (tier === "free" && tableSpots.length >= 3) {
              toast.error("You've reached the free tier limit of 3 table spots. Please upgrade to Pro to add more!");
              return;
            }
            setDialog({ open: true, id: "new" });
          },
        }}
        view="list"
        listRender={(item) => {
          const baseDomain = getBaseDomain();
          // Construct table URL: e.g. http://misenary.localhost:3000/table-1
          const tableUrl = `${window.location.protocol}//${tenantSlug}.${baseDomain}/${item.id}`;
          const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tableUrl)}`;

          return (
            <Card className="hover:shadow-lg transition-all duration-300 rounded-2xl border border-border bg-card/50 backdrop-blur-md flex flex-col h-full overflow-hidden">
              <CardContent className="p-5 flex flex-col items-center justify-center flex-1 gap-4">
                {/* QR Code Container */}
                <div className="relative p-3 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center aspect-square w-44 h-44 group">
                  <img
                    src={qrCodeApiUrl}
                    alt={`QR Code for ${item.name}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center rounded-xl p-3 text-white">
                    <button
                      onClick={() => window.open(tableUrl, "_blank")}
                      className="flex items-center gap-1.5 text-xs bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-md font-semibold w-full justify-center transition-colors"
                    >
                      <ExternalLink className="size-3.5" /> Test Link
                    </button>
                    <button
                      onClick={() => downloadQr(item.name, qrCodeApiUrl)}
                      className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 border border-white/20 px-3 py-1.5 rounded-md font-semibold w-full justify-center transition-colors"
                    >
                      <Download className="size-3.5" /> Download
                    </button>
                  </div>
                </div>

                {/* Table Info */}
                <div className="text-center w-full space-y-1">
                  <h4 className="font-bold text-lg leading-tight line-clamp-1">{item.name}</h4>
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded font-semibold border shadow-sm",
                        item.is_active
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/20"
                          : "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20"
                      )}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </CardContent>
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
          <DialogTitle>
            {dialog.id === "new" ? "New Table Spot" : "Edit Table Spot"}
          </DialogTitle>
          <TableForm
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
}
