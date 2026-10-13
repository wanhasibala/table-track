"use client";

import React, { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  QrCode,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Receipt,
  User,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  UtensilsCrossed,
  Store,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseOrderSchedule } from "@/utils/order-schedule";

interface OrderItem {
  id: string;
  qty: number;
  unit_price: number;
  notes?: string | null;
  menu_item?: {
    name: string;
  } | null;
}

interface OrderRecord {
  id: string;
  order_number: number;
  tenant_id: string;
  table_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  type: string;
  status: string;
  payment_status: string;
  total_amount: number;
  dynamic_qris?: string | null;
  expires_at?: string | null;
  notes?: string | null;
  created_at: string;
  items?: OrderItem[];
  table?: {
    name: string;
  } | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function CashierOrderListPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"awaiting" | "all" | "paid">("awaiting");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected order for confirmation modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cashierName, setCashierName] = useState("Kasir Utama");

  const supabase = createClient();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch tenant info
      const { data: tenantData } = await supabase
        .from("tenant")
        .select("*")
        .eq("id", tenantId)
        .single();
      if (tenantData) setTenant(tenantData);

      // Fetch active orders for this tenant
      const { data: ordersData, error } = await supabase
        .from("order_table")
        .select("*, items:order_item(*, menu_item(name)), table:table_spot(name)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(ordersData || []);
    } catch (err: any) {
      console.error("Error loading cashier orders:", err);
      toast.error(err.message || "Failed to load cashier orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Setup Supabase Realtime Channel
    const channel = supabase
      .channel(`cashier-orders-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_table",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            toast.info(`🔔 Pesanan Baru #${(payload.new as any).order_number || ""} Masuk!`);
            fetchOrders();
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === (payload.new as any).id ? { ...o, ...(payload.new as any) } : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  const handleConfirmPayment = async (order: OrderRecord) => {
    try {
      setConfirming(true);
      const res = await fetch(`/api/orders/${order.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cashierName }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengonfirmasi pembayaran");
      }

      toast.success(`Pesanan #${order.order_number} berhasil ditandai LUNAS!`);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Gagal konfirmasi");
    } finally {
      setConfirming(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.table?.name && o.table.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(o.order_number).includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterTab === "awaiting") {
      return o.payment_status === "awaiting_payment" || o.status === "pending" || o.status === "awaiting_payment";
    }
    if (filterTab === "paid") {
      return o.payment_status === "paid" || o.status === "confirmed" || o.status === "preparing" || o.status === "completed";
    }
    return true;
  });

  const awaitingCount = orders.filter(
    (o) => o.payment_status === "awaiting_payment" || o.status === "pending" || o.status === "awaiting_payment"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white">
                  {tenant?.name || "Kasir Restoran"}
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md">
                  Live Realtime
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Daftar Pembayaran & Verifikasi QRIS Dinamis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Meja, #Order, Nama..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setFilterTab("awaiting")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              filterTab === "awaiting"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Pembayaran</span>
            {awaitingCount > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                filterTab === "awaiting" ? "bg-white text-orange-600" : "bg-orange-500 text-white"
              )}>
                {awaitingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterTab("paid")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              filterTab === "paid"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sudah Lunas</span>
          </button>

          <button
            onClick={() => setFilterTab("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              filterTab === "all"
                ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800"
            )}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Semua Pesanan</span>
          </button>
        </div>

        {/* Order Grid */}
        {filteredOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Tidak Ada Pesanan
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {filterTab === "awaiting"
                ? "Bagus! Semua pesanan saat ini sudah lunas atau belum ada pesanan baru."
                : "Belum ada riwayat pesanan yang cocok dengan filter pencarian."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const isAwaiting =
                order.payment_status === "awaiting_payment" ||
                order.status === "pending" ||
                order.status === "awaiting_payment";

              return (
                <div
                  key={order.id}
                  className={cn(
                    "bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-xs",
                    isAwaiting
                      ? "border-orange-500/40 ring-1 ring-orange-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            #{order.order_number}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {order.type.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-1.5">
                          <span>{order.table?.name ? `Meja: ${order.table.name}` : "Non-Meja"}</span>
                          {order.customer_name ? <span>• {order.customer_name}</span> : null}
                          {(() => {
                            const schedule = parseOrderSchedule(order as any);
                            if (schedule.isScheduled) {
                              return (
                                <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                                  <CalendarClock className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                                  <span>{schedule.formattedSchedule}</span>
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
                          isAwaiting
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        )}
                      >
                        {isAwaiting ? "Awaiting Pay" : "Lunas"}
                      </span>
                    </div>

                    {/* Items Breakdown */}
                    <div className="py-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 max-h-40 overflow-y-auto">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span className="truncate pr-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {item.qty}x
                              </span>{" "}
                              {item.menu_item?.name || "Item"}
                            </span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 shrink-0">
                              {formatCurrency(item.unit_price * item.qty)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground italic text-[11px]">Tidak ada rincian item</p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer & Action Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-muted-foreground">Total Tagihan</span>
                      <span className="text-base font-black text-orange-600 dark:text-orange-400">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>

                    {isAwaiting ? (
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Tandai Lunas (Konfirmasi)</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Telah Terkonfirmasi</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmation Dialog Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Konfirmasi Pembayaran
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pastikan dana telah masuk ke rekening atau e-wallet sebelum menandai pesanan lunas.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nomor Pesanan</span>
                <span className="font-bold">#{selectedOrder.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Meja</span>
                <span className="font-bold">{selectedOrder.table?.name || "Non-Meja"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pembayaran</span>
                <span className="font-black text-sm text-orange-600">
                  {formatCurrency(selectedOrder.total_amount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={confirming}
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={() => handleConfirmPayment(selectedOrder)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                {confirming ? "Memproses..." : "Ya, Tandai Lunas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
