/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Clock, 
  Utensils, 
  Flame, 
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { getFirebaseDb } from "@/utils/firebase";
import { ref, onValue, off } from "firebase/database";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const statusSteps = [
  { key: "pending", label: "Order Placed", desc: "Waiting for confirmation", icon: Clock },
  { key: "confirmed", label: "Confirmed", desc: "Accepted by cashier", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", desc: "Kitchen is preparing your fruits", icon: Flame },
  { key: "served", label: "Served", desc: "Fruits served at your table", icon: Utensils },
  { key: "completed", label: "Completed", desc: "Order complete & paid", icon: Sparkles },
];

export default function OrderStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const { permission, registerToken, loading: pushLoading } = usePushNotifications();

  const slug = order?.tenant?.slug || "";
  const tableId = order?.table_id || "new-order";
  const isSubdomain = typeof window !== "undefined" && slug && window.location.hostname.includes(slug);
  const menuUrl = isSubdomain 
    ? (tableId === "new-order" ? "/" : `/${tableId}`)
    : (tableId === "new-order" ? `/order/${slug}` : `/order/${slug}?tableId=${tableId}`);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 1. Fetch Order and Items
    const loadOrderData = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("order_table")
          .select("*, table_spot(name), tenant(*)")
          .eq("id", orderId)
          .single();
        if (orderError) throw orderError;
        setOrder(orderData);
        setCurrentStatus((prev) => prev || orderData.status);

        const { data: itemsData } = await supabase
          .from("order_item")
          .select("*, menu_item(name, image_url), menu_variant_option(label)")
          .eq("order_id", orderId);
        setOrderItems(itemsData || []);
      } catch (e: any) {
        console.error("Error loading order:", e);
        toast.error("Failed to load order information.");
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();

    // 2. Real-time Subscription to Firebase RTDB updates
    const db = getFirebaseDb();
    let rtdbOrderRef: any = null;
    let rtdbConnectedRef: any = null;

    if (db) {
      console.log("Firebase RTDB client URL:", db.app.options.databaseURL);

      // Listen for connection state
      rtdbConnectedRef = ref(db, ".info/connected");
      onValue(rtdbConnectedRef, (snap) => {
        if (snap.val() === true) {
          console.log("Firebase RTDB client: Connected successfully!");
        } else {
          console.warn("Firebase RTDB client: Disconnected / Attempting to connect...");
        }
      });

      rtdbOrderRef = ref(db, `orders/${orderId}`);
      onValue(rtdbOrderRef, (snapshot) => {
        const data = snapshot.val();
        console.log("Firebase RTDB order snapshot received:", data);
        if (data && data.status) {
          setCurrentStatus((prevStatus) => {
            if (prevStatus && prevStatus !== data.status) {
              toast.success(`Order status updated: ${data.status.toUpperCase()}`);
            }
            return data.status;
          });
        }
      });
    }

    return () => {
      if (rtdbOrderRef) {
        off(rtdbOrderRef);
      }
      if (rtdbConnectedRef) {
        off(rtdbConnectedRef);
      }
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm font-medium">Retrieving order details...</p>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground">Order Not Found</h2>
        <p className="text-muted-foreground text-sm mt-1 max-w-xs">
          We couldn&apos;t locate this order. Please verify the URL or try ordering again.
        </p>
        <button
          onClick={() => router.push(menuUrl)}
          className="mt-6 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Go to Menu
        </button>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex(s => s.key === currentStatus);
  const isCancelled = currentStatus === "cancelled";
 
  return (
    <div className="min-h-screen bg-muted/20 pb-16 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push(menuUrl)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Menu
          </button>
          <span className="text-xs font-bold text-muted-foreground font-mono">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </header>
 
      {/* Main content wrapper */}
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className="bg-card rounded-2xl border border-border/80 shadow-md p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
          
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">
                {isCancelled ? "Order Cancelled" : "Track Your Fruits"}
              </h2>
              <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                <span className="font-semibold text-primary capitalize">
                  Option: {order.type?.replace("_", " ") || "Dine In"}
                </span>
                {order.table_spot?.name && (
                  <span>Table Spot: {order.table_spot.name}</span>
                )}
                {order.type === "delivery" && order.delivery_address && (
                  <div className="mt-1.5 p-2 bg-muted/50 border border-border/40 rounded-lg text-[11px] leading-relaxed max-w-[280px] sm:max-w-none">
                    <span className="font-bold text-foreground block mb-0.5">Delivery Address:</span>
                    {order.delivery_address}
                  </div>
                )}
              </div>
            </div>
            
            <span className={cn(
              "text-xs px-3 py-1 rounded-full font-bold border capitalize shadow-sm",
              isCancelled 
                ? "bg-destructive/10 text-destructive border-destructive/20" 
                : currentStatus === "completed"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-primary/10 text-primary border-primary/20 animate-pulse"
            )}>
              {currentStatus}
            </span>
          </div>

          {/* Cancelled Banner */}
          {isCancelled ? (
            <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="text-xs text-destructive font-medium leading-relaxed">
                This order was cancelled by the store manager. Please speak to our staff if you believe this was an error.
              </div>
            </div>
          ) : (
            /* Vertical Stepper */
            <div className="mt-8 space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted-foreground/15">
              {statusSteps.map((step, idx) => {
                const isCompleted = idx < currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;
                const isUpcoming = idx > currentStatusIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex gap-4 relative">
                    {/* Step Bullet */}
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "bg-card border-primary text-primary shadow-md ring-4 ring-primary/15",
                      isUpcoming && "bg-muted border-muted-foreground/30 text-muted-foreground/60"
                    )}>
                      <StepIcon className="h-4.5 w-4.5" />
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 pt-1.5">
                      <h4 className={cn(
                        "text-sm font-bold",
                        isUpcoming ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {step.label}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Push Notification Promo Banner */}
        {permission !== "granted" && permission !== "unsupported" && (
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-3 flex items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                🔔 Enable Order Alerts
              </h4>
              <p className="text-xs text-muted-foreground leading-normal max-w-[280px]">
                Get instant notifications on your device when your fruits are being prepared or served.
              </p>
            </div>
            <button
              onClick={() => {
                if (orderId) {
                  registerToken({ orderId });
                }
              }}
              disabled={pushLoading}
              className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex-shrink-0 disabled:opacity-50"
            >
              {pushLoading ? "Enabling..." : "Enable"}
            </button>
          </div>
        )}

        {/* Bill Summary */}
        <div className="bg-card rounded-2xl border border-border/80 shadow-md p-6">
          <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 mb-4">
            <ShoppingBag className="h-4.5 w-4.5 text-primary" />
            Items Summary
          </h3>

          <div className="divide-y divide-border/50">
            {orderItems.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">{item.menu_item?.name}</span>
                    <span className="text-muted-foreground text-xs font-mono font-bold">
                      ×{item.qty}
                    </span>
                  </div>
                  {item.menu_variant_option?.label && (
                    <span className="text-[10px] font-semibold text-primary block mt-0.5">
                      {item.menu_variant_option.label}
                    </span>
                  )}
                  {item.notes && (
                    <p className="text-[11px] text-muted-foreground italic mt-0.5">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
                <span className="font-mono text-foreground font-semibold">
                  {formatCurrency(item.unit_price * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 pt-3 mt-3 space-y-1.5 text-xs text-muted-foreground animate-in fade-in duration-200">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(order.total_amount - (order.delivery_fee || 0))}</span>
            </div>
            {order.type === "delivery" && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-mono">{formatCurrency(order.delivery_fee || 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-foreground border-t border-border/40 pt-2.5 mt-1">
              <span>Amount Paid</span>
              <span className="text-lg font-extrabold text-primary font-mono">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push(menuUrl)}
          className="w-full py-3.5 rounded-xl border border-dashed border-primary/40 text-primary font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5 shadow-sm text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Order More Fruits
        </button>
      </main>
    </div>
  );
}
