/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  CreditCard, 
  Check, 
  AlertTriangle, 
  QrCode, 
  Coins, 
  Landmark, 
  Clock, 
  Loader2, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileUpload } from "@/hooks/use-file-upload";


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// CRC16 Checksum helper for EMVCo/QRIS
function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Generate Dynamic QRIS payload by injecting transaction amount
export function generateDynamicQRIS(staticQris: string, amount: number): string {
  let base = staticQris.trim();
  
  // Find index of tag 6304 (CRC) which must remain at the very end
  const crcIndex = base.lastIndexOf("6304");
  if (crcIndex !== -1) {
    base = base.substring(0, crcIndex);
  }

  // 1. Change Point of Initiation Method from Static (11) to Dynamic (12)
  if (base.includes("010211")) {
    base = base.replace("010211", "010212");
  } else if (!base.includes("010212")) {
    base = base.replace("000201", "000201010212");
  }

  // 2. Remove existing amount tag (54) if present
  base = base.replace(/54\d{2}\d+/, "");

  // 3. Add transaction amount (tag 54)
  const amountStr = Math.round(amount).toString();
  const amountLen = amountStr.length.toString().padStart(2, "0");
  const amountTag = `54${amountLen}${amountStr}`;
  base = base + amountTag;

  // 4. Add CRC tag header
  base = base + "6304";

  // 5. Compute and append new CRC16 checksum
  const checksum = crc16(base);
  return base + checksum;
}

const DEFAULT_STATIC_QRIS = "00020101021126590016ID1020021400030103030005204000053033605802ID5918Fruits Shop Jakarta6007Jakarta61051212362070703A016304";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Payment Selection States
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "online" | "cash">("qris");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRecord, setPaymentRecord] = useState<any>(null);
  
  // File upload states
  const { uploadFile } = useFileUpload();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // QRIS simulated states
  const [countdown, setCountdown] = useState(300); // 5 minutes countdown
  
  const qrisPayloadBase = tenant?.qris_payload || DEFAULT_STATIC_QRIS;
  const dynamicQrisPayload = order ? generateDynamicQRIS(qrisPayloadBase, order.total_amount) : "";
  
  const slug = order?.tenant?.slug || "";
  const isSubdomain = typeof window !== "undefined" && slug && window.location.hostname.includes(slug);

  const redirectToStatus = () => {
    if (isSubdomain) {
      router.push(`/status?order_id=${orderId}`);
    } else {
      router.push(`/order/status?order_id=${orderId}`);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const loadData = async () => {
      try {
        // 1. Fetch Order
        const { data: orderData, error: orderError } = await supabase
          .from("order_table")
          .select("*, tenant(*)")
          .eq("id", orderId)
          .single();
        if (orderError) throw orderError;
        setOrder(orderData);
        setTenant(orderData.tenant);

        // 2. Fetch Order Items
        const { data: itemsData } = await supabase
          .from("order_item")
          .select("*, menu_item(name)")
          .eq("order_id", orderId);
        setOrderItems(itemsData || []);

        // 3. Fetch any existing Payment record for this order
        const { data: payData } = await supabase
          .from("payment")
          .select("*")
          .eq("order_id", orderId)
          .maybeSingle();
        
        if (payData) {
          setPaymentRecord(payData);
          // If already paid, redirect straight to status
          if (payData.status === "paid" || orderData.status !== "pending") {
            const orderSlug = orderData?.tenant?.slug || "";
            const currentIsSubdomain = typeof window !== "undefined" && orderSlug && window.location.hostname.includes(orderSlug);
            if (currentIsSubdomain) {
              router.push(`/status?order_id=${orderId}`);
            } else {
              router.push(`/order/status?order_id=${orderId}`);
            }
          }
        }
      } catch (e: any) {
        console.error("Error loading payment data:", e);
        toast.error("Failed to retrieve order payment info.");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // 4. Real-time Subscription to Supabase updates
    const orderChannel = supabase
      .channel(`order-update-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "order_table",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const nextOrder = payload.new as any;
          if (nextOrder && nextOrder.status) {
            setOrder((prev: any) => {
              const updatedOrder = { ...prev, status: nextOrder.status };
              if (nextOrder.status !== "pending" && nextOrder.status !== "cancelled") {
                toast.success("Payment confirmed by Cashier!");
                setTimeout(() => {
                  const orderSlug = updatedOrder?.tenant?.slug || "";
                  const currentIsSubdomain = typeof window !== "undefined" && orderSlug && window.location.hostname.includes(orderSlug);
                  if (currentIsSubdomain) {
                    router.push(`/status?order_id=${orderId}`);
                  } else {
                    router.push(`/order/status?order_id=${orderId}`);
                  }
                }, 50);
              }
              return updatedOrder;
            });
          }
        }
      )
      .subscribe();

    const paymentChannel = supabase
      .channel(`payment-update-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const nextPay = payload.new as any;
          if (nextPay && nextPay.status) {
            setPaymentRecord((prev: any) => {
              const updatedPay = { ...prev, status: nextPay.status };
              if (nextPay.status === "paid") {
                toast.success("Payment verified successfully!");
                setTimeout(() => {
                  const orderSlug = order?.tenant?.slug || "";
                  const currentIsSubdomain = typeof window !== "undefined" && orderSlug && window.location.hostname.includes(orderSlug);
                  if (currentIsSubdomain) {
                    router.push(`/status?order_id=${orderId}`);
                  } else {
                    router.push(`/order/status?order_id=${orderId}`);
                  }
                }, 50);
              }
              return updatedPay;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(paymentChannel);
    };
  }, [orderId, order, isSubdomain]);

  // QRIS Countdown Timer
  useEffect(() => {
    if (paymentRecord && paymentRecord.status === "pending") return;
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, paymentRecord]);

  const handlePaymentSubmit = async () => {
    if (!order) return;
    
    if ((paymentMethod === "qris" || paymentMethod === "online") && !receiptFile) {
      toast.error("Please upload your payment transfer receipt screenshot first.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Processing payment...");

    try {
      const supabase = createClient();
      let uploadedUrl = null;

      if (receiptFile) {
        toast.loading("Uploading receipt screenshot...", { id: loadingToast });
        uploadedUrl = await uploadFile(receiptFile, {
          bucket: "assets",
          folder: "receipts",
        });
      }

      toast.loading("Registering payment request...", { id: loadingToast });
      
      const { data, error } = await supabase
        .from("payment")
        .insert({
          order_id: orderId,
          amount: order.total_amount,
          method: paymentMethod,
          status: "pending",
          tenant_id: tenant?.id,
          payment_receipt_url: uploadedUrl,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setPaymentRecord(data);



      toast.dismiss(loadingToast);
      toast.success("Payment submitted for cashier verification!");
    } catch (e: any) {
      console.error(e);
      toast.dismiss(loadingToast);
      toast.error(e.message || "Failed to submit payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-sm font-medium">Preparing secure checkout...</p>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground">Order Info Missing</h2>
        <p className="text-muted-foreground text-sm mt-1 max-w-xs">
          Please reload or re-order from the catalog.
        </p>
      </div>
    );
  }

  const isPendingCashier = paymentRecord && paymentRecord.status === "pending";

  return (
    <div className="min-h-screen bg-muted/20 pb-16 text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-xl mx-auto px-4 py-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
              💰
            </div>
            <h1 className="text-base font-extrabold tracking-tight text-foreground">
              Secure Checkout
            </h1>
          </div>
          <span className="text-xs font-bold text-muted-foreground font-mono">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Bill Summary Alert */}
        <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-border/50">
            <span className="text-sm font-bold text-muted-foreground">Total Payment</span>
            <span className="text-2xl font-black text-primary font-mono">
              {formatCurrency(order.total_amount)}
            </span>
          </div>

          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex justify-between">
              <span>Customer Name</span>
              <span className="font-bold text-foreground">{order.customer_name || "Guest"}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Option</span>
              <span className="font-bold text-foreground capitalize">{order.type?.replace("_", " ")}</span>
            </div>
            {order.type === "delivery" && order.delivery_address && (
              <div className="p-2.5 bg-muted/30 border border-border/40 rounded-xl mt-1 leading-normal">
                <span className="font-bold text-foreground block mb-0.5">Address:</span>
                {order.delivery_address}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Payment State Panel */}
        {isPendingCashier ? (
          /* WAITING SCREEN */
          <div className="bg-card rounded-2xl border border-border/80 p-6 text-center space-y-6 shadow-md relative overflow-hidden animate-in fade-in duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse" />
            
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 animate-bounce">
              <Clock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-foreground">Waiting for Confirmation</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                We have registered your <strong>{paymentRecord.method?.toUpperCase()}</strong> payment request. Our staff is verifying the receipt. Do not close this page.
              </p>
            </div>

            {/* Simulated payment detail */}
            <div className="p-4 bg-muted/40 rounded-2xl border border-border/40 max-w-xs mx-auto text-left text-xs font-mono space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Method:</span>
                <span className="text-foreground font-bold uppercase">{paymentRecord.method}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Status:</span>
                <span className="text-amber-600 font-bold">Verifying</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total:</span>
                <span className="text-foreground font-bold">{formatCurrency(paymentRecord.amount)}</span>
              </div>
            </div>

            {/* Uploaded receipt preview if any */}
            {paymentRecord.payment_receipt_url && (
              <div className="space-y-1.5 max-w-xs mx-auto">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Submitted Receipt</span>
                <a 
                  href={paymentRecord.payment_receipt_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block relative rounded-xl border border-border overflow-hidden bg-muted/10 hover:opacity-85 transition-opacity"
                >
                  <img 
                    src={paymentRecord.payment_receipt_url} 
                    alt="Receipt Screenshot" 
                    className="max-h-36 mx-auto object-contain p-2"
                  />
                </a>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-primary font-bold">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Real-time link active...</span>
            </div>
          </div>
        ) : (
          /* SELECTION & INSTRUCTIONS SCREEN */
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
                Select Payment Method
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {/* QRIS */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("qris")}
                  className={cn(
                    "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 bg-card hover:bg-muted/10 transition-all",
                    paymentMethod === "qris" 
                      ? "border-primary bg-primary/5 text-primary shadow-xs" 
                      : "border-border/60 text-muted-foreground"
                  )}
                >
                  <QrCode className="h-6 w-6" />
                  <span className="text-xs font-bold">QRIS Code</span>
                </button>

                {/* Bank Transfer */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={cn(
                    "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 bg-card hover:bg-muted/10 transition-all",
                    paymentMethod === "online" 
                      ? "border-primary bg-primary/5 text-primary shadow-xs" 
                      : "border-border/60 text-muted-foreground"
                  )}
                >
                  <Landmark className="h-6 w-6" />
                  <span className="text-xs font-bold">Transfer</span>
                </button>

                {/* Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 bg-card hover:bg-muted/10 transition-all",
                    paymentMethod === "cash" 
                      ? "border-primary bg-primary/5 text-primary shadow-xs" 
                      : "border-border/60 text-muted-foreground"
                  )}
                >
                  <Coins className="h-6 w-6" />
                  <span className="text-xs font-bold">
                    {order.type === "delivery" ? "COD" : "Pay Cash"}
                  </span>
                </button>
              </div>
            </div>

            {/* Payment Method UI Details */}
            <div className="bg-card rounded-2xl border border-border/85 p-6 shadow-sm min-h-[220px] flex flex-col justify-between space-y-5">
              
              {paymentMethod === "qris" && (
                <div className="space-y-5 animate-in fade-in duration-200 flex flex-col items-center">
                  <div className="text-center space-y-1.5">
                    <h4 className="font-extrabold text-sm text-foreground">Scan QRIS Code to Pay</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Compatible with GoPay, GrabPay, OVO, ShopeePay, and all Indonesian Mobile Banking.
                    </p>
                  </div>

                  {/* Dynamic QR Code from QRIS payload */}
                  {dynamicQrisPayload && (
                    <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
                      <div className="relative p-3.5 bg-white border border-slate-200 rounded-2xl shadow-inner max-w-[180px] w-full">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dynamicQrisPayload)}`}
                          alt="Dynamic QRIS QR Code" 
                          className="w-full h-auto object-contain rounded-lg"
                        />
                        {/* QRIS branding tag overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-white px-2 py-0.5 border border-slate-300 rounded font-black text-[9px] tracking-tight text-blue-900 shadow-sm">
                            QRIS
                          </div>
                        </div>
                      </div>
                      
                      {/* Copyable string option */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(dynamicQrisPayload);
                          toast.success("QRIS payload copied to clipboard!");
                        }}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Copy QRIS Text Payload
                      </button>
                    </div>
                  )}

                  <div className="flex gap-4.5 justify-center items-center text-xs font-semibold text-muted-foreground bg-muted/40 px-4 py-2 rounded-xl">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> Timeout:</span>
                    <span className="font-mono text-foreground font-black text-sm">{formatTime(countdown)}</span>
                  </div>
                </div>
              )}

              {paymentMethod === "online" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-foreground">Virtual Account Transfer Details</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Transfer exact bill amount to the official bank account details below:
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 border border-border/40 rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-border/30">
                      <span className="font-bold text-foreground">{tenant?.bank_name || "BCA (Bank Central Asia)"}</span>
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">ATM / Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number</span>
                      <span className="font-mono font-extrabold text-foreground tracking-wider select-all">
                        {tenant?.bank_account_number || "8901 2288 9991"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Name</span>
                      <span className="font-bold text-foreground">
                        {tenant?.bank_account_name || tenant?.name || "Misenary Organic Fruits"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl text-[11px] flex gap-2 items-start leading-normal">
                    <ShieldCheck className="h-4.5 w-4.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Payment verification is secured automatically. After sending the transaction, click the confirmation button below.</span>
                  </div>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-foreground">
                      {order.type === "delivery" ? "Cash on Delivery (COD)" : "Pay Cash at Cashier Desk"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {tenant?.payment_instructions || (
                        order.type === "delivery"
                          ? "Please hand over the exact cash amount directly to our delivery courier driver upon arrival."
                          : "Please walk up to the cashier desk and verify your order ID to settle your bill."
                      )}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 border border-border/40 rounded-2xl space-y-2 text-xs leading-normal">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-amber-500" /> Settle payment locally
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Your order ID is <strong className="text-foreground">#{order.id.slice(0, 8).toUpperCase()}</strong>. Settle your payment, and our cashier will activate your kitchen prep order instantly.
                    </p>
                  </div>
                </div>
              )}

              {/* Receipt File Upload */}
              {(paymentMethod === "qris" || paymentMethod === "online") && (
                <div className="space-y-2 p-4 bg-muted/20 rounded-2xl border border-border/60 animate-in fade-in duration-200">
                  <label className="block text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                    Upload Payment Receipt (Screenshot) <span className="text-destructive">*</span>
                  </label>
                  
                  {receiptPreview ? (
                    <div className="relative border border-border bg-card p-2 rounded-xl flex items-center justify-between gap-3">
                      <img 
                        src={receiptPreview} 
                        alt="Receipt Preview" 
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {receiptFile?.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {((receiptFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview(null);
                        }}
                        className="text-xs font-bold text-destructive hover:underline p-1"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-xl p-5 text-center cursor-pointer bg-card/60">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setReceiptFile(file);
                            setReceiptPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground font-semibold">
                        Drag or click to upload transfer screenshot
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handlePaymentSubmit}
                disabled={isSubmitting || (paymentMethod === "qris" && countdown <= 0)}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <span>Confirm Payment</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
