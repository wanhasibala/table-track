"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetResourceQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
} from "@/store/services/flexible-querry";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChefHat,
  Plus,
  Minus,
  Search,
  Trash2,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Clock,
  User,
  Table as TableIcon,
  CheckCircle2,
  ArrowRight,
  Save,
  Utensils,
  Receipt,
  Sparkles,
  Flame,
  Check,
  Store,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  LogOut,
  CalendarClock,
} from "lucide-react";
import { parseOrderSchedule } from "@/utils/order-schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getImages = (imageUrl: unknown): string[] => {
  if (!imageUrl) return [];
  if (Array.isArray(imageUrl)) return imageUrl.length > 0 ? imageUrl : [];
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

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  notes: string;
  stock: number;
}

export default function PosSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  // 1. PIN Security Lock State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [staffName, setStaffName] = useState<string>("Kasir 1 (Budi)");
  const [pinError, setPinError] = useState<boolean>(false);

  // Check sessionStorage for previous unlock in this browser session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionUnlocked = sessionStorage.getItem(`pos_unlocked_${slug}`);
      if (sessionUnlocked === "true") {
        setIsUnlocked(true);
      }
    }
  }, [slug]);

  // 2. Fetch Tenant by slug
  const { data: tenantResult, isLoading: isTenantLoading } =
    useGetResourceQuery(
      {
        resource: "tenant",
        params: {
          slug,
        },
      },
      { skip: !slug },
    );

  const tenant = tenantResult?.data?.[0];
  const tenantId = tenant?.id;

  // Read configured PIN and PIN requirement from tenant / local storage fallback
  const configuredPin = useMemo(() => {
    if (tenant?.pos_pin) return String(tenant.pos_pin);
    if (typeof window !== "undefined" && slug) {
      const local = localStorage.getItem(`pos_pin_${slug}`);
      if (local) return local;
    }
    return "1234";
  }, [tenant?.pos_pin, slug]);

  const isPinRequired = useMemo(() => {
    if (tenant?.pos_pin_enabled !== undefined && tenant?.pos_pin_enabled !== null) {
      return Boolean(tenant.pos_pin_enabled);
    }
    if (typeof window !== "undefined" && slug) {
      const local = localStorage.getItem(`pos_pin_enabled_${slug}`);
      if (local !== null) return local === "true";
    }
    return true;
  }, [tenant?.pos_pin_enabled, slug]);

  // If owner disabled PIN requirement, auto unlock POS
  useEffect(() => {
    if (!isPinRequired && tenant) {
      setIsUnlocked(true);
    }
  }, [isPinRequired, tenant]);

  const targetPinLength = configuredPin.length || 4;

  // 3. POS Navigation Tab: 'order' | 'queue' | 'payment'
  const [activeTab, setActiveTab] = useState<"order" | "queue" | "payment">(
    "order",
  );

  // Data queries (filtered by tenantId)
  const { data: menuData, refetch: refetchMenu } = useGetResourceQuery(
    {
      resource: "menu_item",
      params: {
        select: "*, category(name)",
        tenant_id: tenantId,
      },
    },
    { skip: !tenantId },
  );

  const { data: categoryData } = useGetResourceQuery(
    {
      resource: "category",
      params: {
        tenant_id: tenantId,
        order: "asc",
        sort: "name",
      },
    },
    { skip: !tenantId },
  );

  const { data: tableData } = useGetResourceQuery(
    {
      resource: "table_spot",
      params: {
        tenant_id: tenantId,
        order: "asc",
        sort: "name",
      },
    },
    { skip: !tenantId },
  );

  const { data: ordersData, refetch: refetchOrders } = useGetResourceQuery(
    {
      resource: "order_table",
      params: {
        select: "*, table_spot(name), order_item(*, menu_item(name, price))",
        tenant_id: tenantId,
        order: "desc",
        sort: "created_at",
      },
    },
    { skip: !tenantId },
  );

  const [createOrder] = useCreateResourceMutation();
  const [createOrderItem] = useCreateResourceMutation();
  const [updateOrder] = useUpdateResourceMutation();
  const [createPayment] = useCreateResourceMutation();

  // POS State
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCheckNumber, setActiveCheckNumber] = useState<number>(() =>
    Math.floor(1000 + Math.random() * 9000),
  );
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "qris" | "card" | "other"
  >("cash");
  const [cashGiven, setCashGiven] = useState<string>("0");
  const [autoReleaseTable, setAutoReleaseTable] = useState<boolean>(true);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [selectedQueueFilter, setSelectedQueueFilter] = useState<
    "all" | "pending" | "confirmed" | "preparing" | "served" | "completed" | "cancelled"
  >("all");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<string>("");

  // Realtime subscription for incoming orders
  useEffect(() => {
    if (!tenantId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`pos-orders-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_table",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          refetchOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, refetchOrders]);

  // Set initial table
  useEffect(() => {
    if (tableData?.data && tableData.data.length > 0 && !selectedTableId) {
      setSelectedTableId(tableData.data[0].id);
    }
  }, [tableData, selectedTableId]);

  // Handle PIN input
  const handlePinKey = (val: string) => {
    setPinError(false);
    if (val === "C") {
      setPinInput("");
    } else if (val === "DEL") {
      setPinInput((prev) => prev.slice(0, -1));
    } else if (pinInput.length < targetPinLength) {
      const nextPin = pinInput + val;
      setPinInput(nextPin);

      // Auto check when target PIN length reached
      if (nextPin.length === targetPinLength) {
        verifyPin(nextPin);
      }
    }
  };

  const verifyPin = (pinToTest: string) => {
    // Check against configured PIN (or fallback default 1234)
    if (pinToTest === configuredPin) {
      setIsUnlocked(true);
      setPinError(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`pos_unlocked_${slug}`, "true");
      }
      toast.success(`Terminal Terbuka! Selamat bekerja, ${staffName}`);
    } else {
      setPinError(true);
      toast.error("PIN Kasir salah! Silakan periksa kembali.");
      setTimeout(() => {
        setPinInput("");
        setPinError(false);
      }, 600);
    }
  };

  const lockTerminal = () => {
    setIsUnlocked(false);
    setPinInput("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`pos_unlocked_${slug}`);
    }
    toast.info("Terminal POS telah dikunci");
  };

  // Categories list
  const categoriesList = useMemo(() => {
    const fromApi =
      categoryData?.data?.map((c: any) => c.name).filter(Boolean) || [];
    const fromItems = Array.from(
      new Set(
        (menuData?.data || []).map((m: any) => m.category?.name || "Uncategorized"),
      ),
    );
    return Array.from(new Set([...fromApi, ...fromItems])).sort();
  }, [categoryData, menuData]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (menuData?.data || []).forEach((item: any) => {
      const cat = item.category?.name || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [menuData]);

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return (menuData?.data || []).filter((item: any) => {
      const cat = item.category?.name || "Uncategorized";
      const matchesCategory =
        selectedCategory === "all" || cat === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuData, selectedCategory, searchQuery]);

  // Selected table name
  const currentTable = useMemo(() => {
    return tableData?.data?.find((t: any) => t.id === selectedTableId);
  }, [tableData, selectedTableId]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const taxPb1 = useMemo(() => {
    return Math.round(subtotal * 0.1); // 10% PB1 Resto
  }, [subtotal]);

  const serviceCharge = useMemo(() => {
    return Math.round(subtotal * 0.05); // 5% Service charge
  }, [subtotal]);

  const grandTotal = useMemo(() => {
    return subtotal + taxPb1 + serviceCharge;
  }, [subtotal, taxPb1, serviceCharge]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  // Cart operations
  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          id: `cart_${Date.now()}_${item.id}`,
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          notes: "",
          stock: item.stock ?? 99,
        },
      ];
    });
    toast.success(`Ditambahkan: ${item.name}`);
  };

  const updateQty = (cartId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const saveNotes = (cartId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === cartId ? { ...item, notes } : item)),
    );
    setEditingNotesId(null);
    setNotesInput("");
  };

  // Open Bill / Simpan Pesanan
  const handleOpenBill = async () => {
    if (cart.length === 0) {
      toast.error("Keranjang pesanan masih kosong!");
      return;
    }
    if (!tenantId) {
      toast.error("Tenant ID tidak valid");
      return;
    }

    try {
      const orderPayload = {
        tenant_id: tenantId,
        order_number: activeCheckNumber,
        table_id: orderType === "dine_in" ? selectedTableId || null : null,
        type: orderType,
        status: "confirmed" as const,
        total_amount: grandTotal,
        customer_name: orderType === "dine_in" ? currentTable?.name : "Takeaway",
        notes: `POS Kiosk Order by ${staffName}`,
      };

      const orderResult: any = await createOrder({
        resource: "order_table",
        body: orderPayload,
      }).unwrap();

      const newOrderId = orderResult?.data?.id;

      if (newOrderId) {
        // Insert order items
        for (const item of cart) {
          await createOrderItem({
            resource: "order_item",
            body: {
              tenant_id: tenantId,
              order_id: newOrderId,
              menu_item_id: item.menuItemId,
              qty: item.qty,
              unit_price: item.price,
              notes: item.notes || null,
            },
          });
        }
        setCurrentOrderId(newOrderId);
      }

      toast.success(
        `Pesanan #${activeCheckNumber} berhasil dikirim ke Antrean Dapur!`,
      );
      refetchOrders();
    } catch (err) {
      console.error("Failed to open bill:", err);
      toast.error("Gagal menyimpan pesanan ke dapur.");
    }
  };

  // Switch to Payment
  const handleProceedToPayment = async () => {
    if (cart.length === 0) {
      toast.error("Pilih menu terlebih dahulu untuk memproses pembayaran.");
      return;
    }
    if (!currentOrderId) {
      await handleOpenBill();
    }
    setCashGiven(String(grandTotal));
    setActiveTab("payment");
  };

  // Cash numpad helper
  const handleNumpadInput = (char: string) => {
    if (char === "C") {
      setCashGiven("0");
    } else if (char === "DEL") {
      setCashGiven((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
    } else if (char === "00" || char === "000") {
      setCashGiven((prev) => (prev === "0" ? "0" : prev + char));
    } else {
      setCashGiven((prev) => (prev === "0" ? char : prev + char));
    }
  };

  const parsedCashGiven = Number(cashGiven) || 0;
  const changeAmount = parsedCashGiven - grandTotal;

  // Complete Payment & Close Table
  const handleCompletePayment = async () => {
    if (paymentMethod === "cash" && parsedCashGiven < grandTotal) {
      toast.error("Jumlah uang yang diterima kurang dari total tagihan!");
      return;
    }

    try {
      if (currentOrderId && tenantId) {
        // 1. Create Payment record
        await createPayment({
          resource: "payment",
          body: {
            tenant_id: tenantId,
            order_id: currentOrderId,
            amount: grandTotal,
            method: paymentMethod,
            status: "paid" as const,
            paid_at: new Date().toISOString(),
          },
        });

        // 2. Update Order to completed
        await updateOrder({
          resource: "order_table",
          id: currentOrderId,
          body: {
            status: "completed" as const,
          },
        });
      }

      toast.success("Pembayaran Berhasil! Meja telah ditutup.");
      setReceiptModalOpen(true);
      refetchOrders();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Terjadi kesalahan saat memproses pembayaran.");
    }
  };

  // Reset order session
  const resetOrderSession = () => {
    setCart([]);
    setCurrentOrderId(null);
    setActiveCheckNumber(Math.floor(1000 + Math.random() * 9000));
    setCashGiven("0");
    setReceiptModalOpen(false);
    setActiveTab("order");
  };

  // Update order status in queue
  const handleUpdateQueueStatus = async (
    orderId: string,
    nextStatus: string,
  ) => {
    try {
      const updateBody: any = { status: nextStatus };
      

      await updateOrder({
        resource: "order_table",
        id: orderId,
        body: updateBody,
      });
      toast.success(`Status pesanan diubah ke: ${nextStatus.toUpperCase()}`);
      refetchOrders();
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengupdate status pesanan");
    }
  };

  // Filtered queue orders
  const queueOrders = useMemo(() => {
    const allOrders = ordersData?.data || [];
    if (selectedQueueFilter === "all") {
      return allOrders;
    }
    return allOrders.filter((o: any) => o.status === selectedQueueFilter);
  }, [ordersData, selectedQueueFilter]);

  // Loading or Not Found State
  if (isTenantLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Store className="w-10 h-10 text-primary animate-bounce" />
        <p className="font-mono text-sm text-muted-foreground">
          Memuat Terminal POS...
        </p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <ChefHat className="w-16 h-16 text-muted-foreground/40 mb-3" />
        <h2 className="text-xl font-bold text-foreground">Restoran Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Slug &quot;{slug}&quot; tidak terdaftar pada sistem Table Track. Pastikan
          penulisan alamat sudah sesuai.
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 1: QUICK PIN LOCK SCREEN (Option A)
  // -------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center p-4 select-none">
        <Card className="w-full max-w-sm bg-card/90 backdrop-blur-xl border rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-6">
          {/* Tenant Identity */}
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-lg mb-1">
              <Store className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">
              {tenant.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Terminal POS Kasir (Kiosk Mode)</span>
            </div>
          </div>

          {/* Staff Selector */}
          <div className="w-full">
            <label className="text-[11px] font-mono text-muted-foreground uppercase font-semibold block mb-1">
              Pilih Staf Kasir
            </label>
            <select
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border bg-muted/30 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="Kasir 1 (Budi)">Kasir 1 • Budi (Shift Pagi)</option>
              <option value="Kasir 2 (Siti)">Kasir 2 • Siti (Shift Siang)</option>
              <option value="Manager (Rian)">Manager • Rian</option>
            </select>
          </div>

          {/* PIN Display Indicators */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              Masukkan {targetPinLength}-Digit PIN Kasir
            </span>
            <div
              className={cn(
                "flex items-center gap-3 p-2 rounded-2xl transition-all",
                pinError && "animate-shake bg-destructive/10",
              )}
            >
              {Array.from({ length: targetPinLength }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all duration-200",
                    pinInput.length > idx
                      ? "bg-primary border-primary scale-110 shadow-sm"
                      : "border-muted-foreground/40 bg-transparent",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Touch Numpad */}
          <div className="w-full grid grid-cols-3 gap-2.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "DEL"].map(
              (btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => handlePinKey(btn)}
                  className={cn(
                    "h-14 rounded-2xl text-lg font-bold font-mono transition-all flex items-center justify-center active:scale-90 shadow-sm border cursor-pointer",
                    btn === "C"
                      ? "bg-destructive/10 text-destructive border-destructive/20 text-sm"
                      : btn === "DEL"
                        ? "bg-muted text-foreground text-sm"
                        : "bg-background text-foreground hover:bg-muted/40",
                  )}
                >
                  {btn === "DEL" ? "⌫" : btn}
                </button>
              ),
            )}
          </div>

          <p className="text-[11px] font-mono text-muted-foreground/60 text-center">
            *PIN Kasir dapat diatur oleh Owner melalui menu Pengaturan
          </p>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 2: ACTIVE POS WORKSPACE
  // -------------------------------------------------------------
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-surface text-on-surface antialiased select-none">
      {/* Top POS Header */}
      <header className="shrink-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b shadow-sm px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-md">
              <Store className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-xs text-foreground tracking-tight leading-none">
                {tenant.name}
              </span>
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                POS Terminal
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-border hidden sm:block" />

          {/* POS Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-xl border">
            <button
              onClick={() => setActiveTab("order")}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                activeTab === "order"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/80",
              )}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Kasir / Order</span>
            </button>

            <button
              onClick={() => setActiveTab("queue")}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                activeTab === "queue"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/80",
              )}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Antrean (Queue)</span>
              {(ordersData?.data?.filter((o: any) => o.status === "preparing")
                .length || 0) > 0 && (
                <span className="h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {
                    ordersData?.data?.filter(
                      (o: any) => o.status === "preparing",
                    ).length
                  }
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("payment")}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                activeTab === "payment"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/80",
              )}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Pembayaran & Meja</span>
            </button>
          </nav>
        </div>

        {/* Right Status Badges & Lock Terminal */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online • Sync</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border text-xs font-medium">
            <User className="w-3 h-3 text-primary" />
            <span className="font-semibold">{staffName}</span>
          </div>

          {/* Lock Terminal Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={lockTerminal}
            className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Kunci Terminal"
          >
            <Lock className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs font-mono hidden sm:inline">Kunci</span>
          </Button>
        </div>
      </header>

      {/* VIEW 1: KASIR / ORDER */}
      {activeTab === "order" && (
        <main className="flex-1 overflow-hidden p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* LEFT 7-COL: Menu Catalog & Table Mode (Scrollable menu section) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 min-h-0 h-full overflow-hidden">
            {/* Table Selector & Dine-In/Takeaway Mode (Fixed Header) */}
            <div className="shrink-0 bg-card border rounded-xl p-2.5 shadow-sm flex flex-wrap items-center justify-between gap-2.5">
              {/* Table Picker */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <TableIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="font-bold text-sm bg-transparent border-b border-border/70 focus:outline-none focus:border-primary cursor-pointer pr-1"
                    >
                      {tableData?.data?.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                      {!tableData?.data?.length && (
                        <option value="">Meja 01 (Default)</option>
                      )}
                    </select>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    {orderType === "dine_in"
                      ? "Zona Utama • Indoor"
                      : "Direct Pick-up"}
                  </span>
                </div>
              </div>

              {/* Order Mode Toggle */}
              <div className="flex items-center p-0.5 rounded-lg bg-muted/40 border">
                <button
                  type="button"
                  onClick={() => setOrderType("dine_in")}
                  className={cn(
                    "h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all",
                    orderType === "dine_in"
                      ? "bg-card text-primary shadow-sm border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Utensils className="w-3 h-3" />
                  <span>Dine-In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("takeaway")}
                  className={cn(
                    "h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all",
                    orderType === "takeaway"
                      ? "bg-card text-primary shadow-sm border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Store className="w-3 h-3" />
                  <span>Takeaway</span>
                </button>
              </div>
            </div>

            {/* Category Pills & Quick Search (Fixed Header) */}
            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0",
                    selectedCategory === "all"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-card border text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  <span>Semua</span>
                  <span
                    className={cn(
                      "font-mono text-[9px] px-1.5 py-0.2 rounded-full",
                      selectedCategory === "all"
                        ? "bg-white/20 text-white"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {menuData?.data?.length || 0}
                  </span>
                </button>

                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0",
                      selectedCategory === cat
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-card border text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    <span>{cat}</span>
                    <span
                      className={cn(
                        "font-mono text-[9px] px-1.5 py-0.2 rounded-full",
                        selectedCategory === cat
                          ? "bg-white/20 text-white"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-48 shrink-0">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-card"
                />
              </div>
            </div>

            {/* ONLY MENU SECTION SCROLLS: Compact Menu Grid */}
            <div className="flex-1 overflow-y-auto pr-1 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredMenuItems.map((item: any) => {
                  const images = getImages(item.image_url);
                  const hasImage = images.length > 0;
                  const firstImage = hasImage ? images[0] : "";
                  const isOutOfStock = item.stock <= 0 || !item.is_available;

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isOutOfStock && addToCart(item)}
                      className={cn(
                        "bg-card border rounded-xl p-2 shadow-sm flex flex-col justify-between group transition-all duration-150 select-none",
                        isOutOfStock
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-[0.98]",
                      )}
                    >
                      {/* Photo Container */}
                      <div className="relative w-full aspect-[16/10] max-h-24 rounded-lg overflow-hidden bg-muted/40 mb-2">
                        {hasImage ? (
                          <img
                            src={firstImage}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 p-2">
                            <ChefHat className="w-6 h-6 mb-0.5" />
                            <span className="text-[9px]">No photo</span>
                          </div>
                        )}

                        {/* Stock status badge */}
                        <span
                          className={cn(
                            "absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wide backdrop-blur-md shadow-sm",
                            item.stock > 0 && item.is_available
                              ? "bg-emerald-500/90 text-white"
                              : "bg-destructive/90 text-white",
                          )}
                        >
                          {item.stock > 0 && item.is_available
                            ? `RDY ${item.stock}`
                            : "HABIS"}
                        </span>
                      </div>

                      {/* Title & Category */}
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {item.category?.name || "Menu"}
                        </p>
                      </div>

                      {/* Price & Add button */}
                      <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-border/40">
                        <span className="font-mono text-xs font-bold text-primary tracking-tight">
                          {formatCurrency(item.price)}
                        </span>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) addToCart(item);
                          }}
                          className="w-7 h-7 rounded-lg bg-primary text-on-primary hover:bg-primary/90 active:scale-90 transition-all flex items-center justify-center shadow-sm disabled:opacity-40"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredMenuItems.length === 0 && (
                  <div className="col-span-full border rounded-xl p-8 text-center bg-card text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                    <ChefHat className="w-8 h-8 text-muted-foreground/30" />
                    <p className="font-semibold text-xs">Menu tidak ditemukan</p>
                    <p className="text-[10px]">Coba sesuaikan pencarian atau filter</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 5-COL: Active Order Check & Cashier Actions (Fixed, does NOT scroll) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full overflow-hidden">
            <div className="bg-card border rounded-2xl shadow-md p-3.5 flex flex-col justify-between h-full overflow-hidden">
              {/* Check Header */}
              <div className="shrink-0 flex flex-col gap-1 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-primary">
                      #POS-{activeCheckNumber}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-bold text-xs text-foreground">
                      {orderType === "dine_in"
                        ? currentTable?.name || "Meja 01"
                        : "Takeaway"}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4 font-semibold">
                    {totalItemCount} Items
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span>
                    {orderType === "dine_in" ? "Dine-In" : "Takeaway"} • {staffName}
                  </span>
                  <span className="text-emerald-600 font-medium">Auto-saved</span>
                </div>
              </div>

              {/* Order Items List: Fitted neatly without forced outer scrolling */}
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5 my-2">
                {cart.length === 0 ? (
                  <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center text-muted-foreground gap-1.5 border border-dashed rounded-xl p-3">
                    <Utensils className="w-6 h-6 text-muted-foreground/30" />
                    <p className="text-xs font-medium">
                      Keranjang kosong. Pilih menu di sebelah kiri.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-muted/30 border flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-bold text-xs text-foreground truncate">
                            {item.name}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            @ {formatCurrency(item.price)}
                          </span>
                        </div>

                        {/* Touch Stepper */}
                        <div className="flex items-center gap-1 bg-background border rounded-lg p-0.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, -1)}
                            className="w-6 h-6 rounded bg-muted text-foreground hover:bg-muted/80 active:scale-90 transition-transform flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs font-bold w-5 text-center">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, 1)}
                            className="w-6 h-6 rounded bg-primary text-on-primary hover:bg-primary/90 active:scale-90 transition-transform flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Notes & Subtotal */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/30">
                        {editingNotesId === item.id ? (
                          <div className="flex items-center gap-1 flex-1 mr-2">
                            <Input
                              value={notesInput}
                              onChange={(e) => setNotesInput(e.target.value)}
                              placeholder="Catatan..."
                              className="h-6 text-[10px]"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="h-6 px-1.5 text-[10px]"
                              onClick={() => saveNotes(item.id, notesInput)}
                            >
                              OK
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNotesId(item.id);
                              setNotesInput(item.notes);
                            }}
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5 text-left truncate max-w-[160px]"
                          >
                            <Sparkles className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">
                              {item.notes ? item.notes : "+ Catatan"}
                            </span>
                          </button>
                        )}

                        <span className="font-mono font-bold text-xs text-foreground shrink-0">
                          {formatCurrency(item.price * item.qty)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bill Calculation Summary (Fixed Bottom Section) */}
              <div className="shrink-0 flex flex-col gap-1.5 pt-2 border-t">
                <div className="flex justify-between items-center text-[11px] text-muted-foreground font-mono">
                  <span>Subtotal ({totalItemCount} porsi)</span>
                  <span className="text-foreground font-semibold">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-muted-foreground font-mono">
                  <span>PB1 Resto (10%)</span>
                  <span className="text-foreground font-semibold">
                    {formatCurrency(taxPb1)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-muted-foreground font-mono">
                  <span>Service Charge (5%)</span>
                  <span className="text-foreground font-semibold">
                    {formatCurrency(serviceCharge)}
                  </span>
                </div>

                {/* Grand Total Hero Banner */}
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Total Tagihan
                    </span>
                    <span className="font-mono text-lg text-primary font-extrabold tracking-tight">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  <Receipt className="w-5 h-5 text-primary" />
                </div>

                {/* Touch Actions */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenBill}
                    className="col-span-2 min-h-[40px] text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Open Bill</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleProceedToPayment}
                    className="col-span-3 min-h-[40px] text-xs font-bold bg-primary text-on-primary flex items-center justify-center gap-1 shadow-md hover:bg-primary/90"
                  >
                    <span>Lanjut Bayar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: ANTREAN (QUEUE) */}
      {activeTab === "queue" && (
        <main className="flex-1 p-4 lg:p-6 space-y-6">
          {/* Top Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Pesanan Aktif
                  </span>
                  <span className="font-mono text-2xl font-bold text-foreground">
                    {
                      (ordersData?.data || []).filter(
                        (o: any) =>
                          o.status === "preparing" || o.status === "confirmed",
                      ).length
                    }{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      tiket
                    </span>
                  </span>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            </div>

            <div className="bg-card border p-4 rounded-2xl shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider block font-semibold">
                  Rerata Masak
                </span>
                <span className="font-mono text-2xl font-bold text-foreground">
                  12{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    menit / tiket
                  </span>
                </span>
              </div>
            </div>

            <div className="bg-card border p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Kitchen Display
                  </span>
                  <span className="font-bold text-base text-emerald-600 flex items-center gap-1">
                    Online • Live
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Sync Realtime
              </Badge>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "Semua" },
              { id: "pending", label: "Pending" },
              { id: "confirmed", label: "Confirmed" },
              { id: "preparing", label: "Preparing" },
              { id: "served", label: "Served" },
              { id: "completed", label: "Completed" },
              { id: "cancelled", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedQueueFilter(tab.id as any)}
                className={cn(
                  "min-h-[40px] px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  selectedQueueFilter === tab.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-card border text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Ticket Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {queueOrders.map((order: any) => {
              const statusBadge =
                order.status === "pending"
                  ? { label: "Pending", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/25" }
                  : order.status === "confirmed"
                    ? { label: "Confirmed", color: "bg-blue-500/10 text-blue-600 border-blue-500/25" }
                    : order.status === "preparing"
                      ? { label: "Preparing", color: "bg-purple-500/10 text-purple-600 border-purple-500/25" }
                      : order.status === "served"
                        ? { label: "Served", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/25" }
                        : order.status === "completed"
                          ? { label: "Completed", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" }
                          : order.status === "cancelled"
                            ? { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/25" }
                            : { label: order.status || "Pending", color: "bg-muted text-muted-foreground" };

              return (
                <Card
                  key={order.id}
                  className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-sm text-primary">
                            #TT-{order.order_number}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {order.type || "Dine In"}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">
                          {order.table_spot?.name || order.customer_name || "Meja"}
                        </h3>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={cn(
                            "text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border",
                            statusBadge.color,
                          )}
                        >
                          {statusBadge.label}
                        </span>
                        {(() => {
                          const schedule = parseOrderSchedule(order);
                          if (schedule.isScheduled) {
                            return (
                              <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30 shadow-2xs">
                                <CalendarClock className="w-3 h-3 shrink-0 text-purple-600 dark:text-purple-400" />
                                <span>{schedule.formattedSchedule}</span>
                              </span>
                            );
                          }
                          return (
                            <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Order Items Breakdown */}
                    <div className="bg-muted/30 border rounded-xl p-3 space-y-2 max-h-44 overflow-y-auto">
                      {order.order_item?.map((oi: any) => (
                        <div
                          key={oi.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold w-5 text-center text-primary bg-primary/10 rounded px-1">
                              {oi.qty}x
                            </span>
                            <span className="font-medium text-foreground">
                              {oi.menu_item?.name || "Menu item"}
                            </span>
                          </div>
                          <span className="font-mono text-muted-foreground">
                            {formatCurrency(oi.unit_price * oi.qty)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between text-xs px-1 font-mono">
                      <span className="text-muted-foreground">Total Tagihan</span>
                      <span className="font-bold text-sm text-foreground">
                        {formatCurrency(order.total_amount || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Status Selection Buttons */}
                  <div className="pt-3 border-t space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Pilih Status Pesanan:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        {
                          status: "pending",
                          label: "Pending",
                          icon: Clock,
                          activeClass: "bg-yellow-500 text-white border-yellow-600 shadow-xs",
                          idleClass: "bg-muted/40 hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-600",
                        },
                        {
                          status: "confirmed",
                          label: "Confirmed",
                          icon: CheckCircle2,
                          activeClass: "bg-blue-600 text-white border-blue-700 shadow-xs",
                          idleClass: "bg-muted/40 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600",
                        },
                        {
                          status: "preparing",
                          label: "Preparing",
                          icon: Flame,
                          activeClass: "bg-purple-600 text-white border-purple-700 shadow-xs",
                          idleClass: "bg-muted/40 hover:bg-purple-500/10 text-muted-foreground hover:text-purple-600",
                        },
                        {
                          status: "served",
                          label: "Served",
                          icon: Utensils,
                          activeClass: "bg-indigo-600 text-white border-indigo-700 shadow-xs",
                          idleClass: "bg-muted/40 hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-600",
                        },
                        {
                          status: "completed",
                          label: "Completed",
                          icon: Check,
                          activeClass: "bg-emerald-600 text-white border-emerald-700 shadow-xs",
                          idleClass: "bg-muted/40 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600",
                        },
                        {
                          status: "cancelled",
                          label: "Cancelled",
                          icon: Trash2,
                          activeClass: "bg-destructive text-white border-destructive shadow-xs",
                          idleClass: "bg-muted/40 hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
                        },
                      ].map((btn) => {
                        const isActive = order.status === btn.status;
                        const Icon = btn.icon;
                        return (
                          <button
                            key={btn.status}
                            type="button"
                            onClick={() => handleUpdateQueueStatus(order.id, btn.status)}
                            className={cn(
                              "px-2 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer",
                              isActive
                                ? btn.activeClass
                                : cn(btn.idleClass, "border-border/60")
                            )}
                          >
                            <Icon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{btn.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })}

            {queueOrders.length === 0 && (
              <div className="col-span-full border rounded-2xl p-12 text-center bg-card text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Clock className="w-10 h-10 text-muted-foreground/30" />
                <p className="font-semibold text-sm">Tidak ada antrean pesanan</p>
                <p className="text-xs">Antrean baru akan muncul otomatis secara realtime</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* VIEW 3: PEMBAYARAN & MEJA */}
      {activeTab === "payment" && (
        <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT 5-COL: Bill Breakdown & Table release */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
              {/* Ticket Meta */}
              <div className="flex items-start justify-between pb-3 border-b">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono text-xs uppercase font-semibold">
                      {orderType === "dine_in" ? "DINE-IN" : "TAKEAWAY"}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      Tiket #POS-{activeCheckNumber}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-foreground">
                    {orderType === "dine_in"
                      ? currentTable?.name || "Meja 01"
                      : "Pesanan Takeaway"}
                  </h2>
                </div>

                <div className="text-right text-xs font-mono text-muted-foreground space-y-0.5">
                  <p>Kasir: {staffName}</p>
                  <p className="text-emerald-600 font-medium">Session Active</p>
                </div>
              </div>

              {/* Total Tagihan Bersih Hero Panel */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Total Tagihan Bersih
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-2xl font-extrabold text-primary tracking-tight">
                    {formatCurrency(grandTotal)}
                  </span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    Final Bill
                  </Badge>
                </div>
              </div>

              {/* Itemized Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  Rincian Menu ({cart.length} item)
                </span>
                <div className="divide-y max-h-48 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="py-2 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-mono font-bold text-primary bg-muted px-1.5 py-0.5 rounded">
                          {item.qty}x
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.name}
                          </p>
                          {item.notes && (
                            <p className="text-[11px] text-muted-foreground">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-foreground">
                        {formatCurrency(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax & Subtotal */}
              <div className="bg-muted/30 border rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>PB1 Resto (10%)</span>
                  <span>{formatCurrency(taxPb1)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service Charge (5%)</span>
                  <span>{formatCurrency(serviceCharge)}</span>
                </div>
              </div>

              {/* Auto Table Release Toggle */}
              <div className="p-3 bg-muted/40 border rounded-xl flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoReleaseTable}
                    onChange={(e) => setAutoReleaseTable(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">
                      Kosongkan Meja Otomatis
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Set status meja jadi &apos;Tersedia&apos; saat lunas
                    </span>
                  </div>
                </label>
              </div>

              {/* Print Receipt Action */}
              <Button
                variant="outline"
                onClick={() => setReceiptModalOpen(true)}
                className="w-full h-11 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk Thermal 80mm</span>
              </Button>
            </div>
          </div>

          {/* RIGHT 7-COL: Payment Execution & Cash Numpad */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
              {/* Payment Method Selector Tabs */}
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
                  Metode Pembayaran
                </span>
                <div className="grid grid-cols-3 gap-2 p-1 bg-muted/40 border rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={cn(
                      "min-h-[44px] py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all",
                      paymentMethod === "cash"
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Tunai / Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qris")}
                    className={cn(
                      "min-h-[44px] py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all",
                      paymentMethod === "qris"
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QRIS Dinamis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "min-h-[44px] py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all",
                      paymentMethod === "card"
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Kartu Debit / EDC</span>
                  </button>
                </div>
              </div>

              {/* Cash Numpad Section */}
              {paymentMethod === "cash" && (
                <div className="space-y-4">
                  {/* Quick Nominal Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCashGiven(String(grandTotal))}
                      className="h-10 text-xs font-mono font-bold"
                    >
                      Uang Pas
                    </Button>
                    {[50000, 100000, 200000, 300000, 500000].map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        onClick={() => setCashGiven(String(amt))}
                        className="h-10 text-xs font-mono font-bold"
                      >
                        {formatCurrency(amt)}
                      </Button>
                    ))}
                  </div>

                  {/* Cash Given & Change Displays */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/30 border">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase font-semibold">
                        Uang Diterima
                      </span>
                      <p className="font-mono text-lg font-bold text-foreground mt-0.5">
                        {formatCurrency(parsedCashGiven)}
                      </p>
                    </div>

                    <div
                      className={cn(
                        "p-3 rounded-xl border",
                        changeAmount >= 0
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          : "bg-destructive/10 border-destructive/20 text-destructive",
                      )}
                    >
                      <span className="font-mono text-[10px] uppercase font-semibold">
                        Kembalian
                      </span>
                      <p className="font-mono text-lg font-bold mt-0.5">
                        {changeAmount >= 0
                          ? formatCurrency(changeAmount)
                          : `Kurang ${formatCurrency(Math.abs(changeAmount))}`}
                      </p>
                    </div>
                  </div>

                  {/* Touch Numpad */}
                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "000"].map(
                      (key) => (
                        <Button
                          key={key}
                          type="button"
                          variant="outline"
                          onClick={() => handleNumpadInput(key)}
                          className="h-12 text-base font-mono font-bold active:scale-95 transition-transform"
                        >
                          {key}
                        </Button>
                      ),
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={() => handleNumpadInput("C")}
                      className="h-11 font-mono font-bold text-xs"
                    >
                      Clear (C)
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => handleNumpadInput("DEL")}
                      className="h-11 font-mono font-bold text-xs"
                    >
                      Hapus ⌫
                    </Button>
                  </div>
                </div>
              )}

              {/* QRIS Section */}
              {paymentMethod === "qris" && (
                <div className="border rounded-2xl p-6 text-center bg-muted/20 flex flex-col items-center justify-center gap-3">
                  <div className="w-48 h-48 bg-white border p-3 rounded-xl flex items-center justify-center shadow-inner">
                    <QrCode className="w-36 h-36 text-slate-800" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-foreground">
                      Scan QRIS Restoran
                    </p>
                    <p className="font-mono text-xs text-primary font-bold">
                      Nominal: {formatCurrency(grandTotal)}
                    </p>
                  </div>
                </div>
              )}

              {/* Card / EDC Section */}
              {paymentMethod === "card" && (
                <div className="border rounded-2xl p-6 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span>Mesin EDC / Debit Mandiri & BCA</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Silakan swipe/insert kartu pelanggan pada mesin EDC kasir
                    sebesar <strong>{formatCurrency(grandTotal)}</strong>.
                  </p>
                  <Input placeholder="Nomor Referensi / Approval Code EDC (Opsional)" className="h-10 text-xs" />
                </div>
              )}

              {/* Final Selesaikan Pembayaran Button */}
              <Button
                type="button"
                onClick={handleCompletePayment}
                className="w-full min-h-[52px] text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Selesaikan Pembayaran & Tutup Meja</span>
              </Button>
            </div>
          </div>
        </main>
      )}

      {/* RECEIPT MODAL */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-md font-mono">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-base">
              Struk Pembayaran (Thermal 80mm)
            </DialogTitle>
          </DialogHeader>

          <div
            id="printable-receipt"
            className="p-4 bg-muted/30 border border-dashed rounded-xl space-y-3 text-xs"
          >
            <div className="text-center space-y-0.5 border-b pb-2">
              <h3 className="font-bold text-sm text-foreground uppercase">
                {tenant.name}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {tenant.address || "Jl. Restoran No. 01, Jakarta"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Tiket: #POS-{activeCheckNumber} • {new Date().toLocaleString("id-ID")}
              </p>
            </div>

            <div className="divide-y space-y-1 pt-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between py-1 text-xs">
                  <span>
                    {item.name} x{item.qty}
                  </span>
                  <span>{formatCurrency(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>PB1 Resto (10%):</span>
                <span>{formatCurrency(taxPb1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service (5%):</span>
                <span>{formatCurrency(serviceCharge)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs border-t pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="uppercase">{paymentMethod}</span>
              </div>
              {paymentMethod === "cash" && (
                <>
                  <div className="flex justify-between">
                    <span>Bayar:</span>
                    <span>{formatCurrency(parsedCashGiven)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembali:</span>
                    <span>{formatCurrency(Math.max(0, changeAmount))}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-center text-[10px] text-muted-foreground pt-2 border-t">
              Terima Kasih Atas Kunjungan Anda!
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
              className="flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Struk</span>
            </Button>
            <Button onClick={resetOrderSession} className="bg-primary">
              Order Baru
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POS Footer Status Bar */}
      <footer className="w-full bg-card/80 border-t py-2.5 px-4 lg:px-6 flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground">
        <div>TABLE TRACK V2.4 • TERMINAL POS ({tenant.name.toUpperCase()})</div>
        <div className="flex items-center gap-4">
          <span>SLUG: {slug}</span>
          <span>SHIFT ACTIVE: 07:00 - 15:00</span>
        </div>
      </footer>
    </div>
  );
}
