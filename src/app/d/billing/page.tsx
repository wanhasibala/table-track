"use client";

import React, { useState } from "react";
import { useGetResourceQuery, useGetResourceByIdQuery } from "@/store/services/flexible-querry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Check, ShieldAlert, Sparkles, CreditCard, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const [upgrading, setUpgrading] = useState(false);

  // Get active tenant details
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const tenantId = user?.tenant_id;

  const { data: tenantData, isLoading: tenantLoading } = useGetResourceByIdQuery(
    { resource: "tenant", id: tenantId! },
    { skip: !tenantId }
  );

  const { data: menuData, isLoading: menuLoading } = useGetResourceQuery({
    resource: "menu_item",
  });

  const { data: tableData, isLoading: tableLoading } = useGetResourceQuery({
    resource: "table_spot",
  });

  const tenant = tenantData?.data;
  const subscriptionTier = tenant?.subscription_tier || "free";
  
  const menuItemsCount = menuData?.data?.length || 0;
  const tableSpotsCount = tableData?.data?.length || 0;

  const handleUpgrade = async () => {
    if (!tenantId || !user?.email) {
      toast.error("Account error: Missing tenant ID or user email.");
      return;
    }

    setUpgrading(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          email: user.email,
        }),
      });

      const data = await response.json();
      if (data.url) {
        toast.loading("Redirecting to Stripe Checkout...", { id: "checkout-toast" });
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to initiate upgrade.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  const isPro = subscriptionTier === "pro";

  // Calculate usage percentages
  const menuPercent = isPro ? 0 : Math.min((menuItemsCount / 5) * 100, 100);
  const tablePercent = isPro ? 0 : Math.min((tableSpotsCount / 3) * 100, 100);

  if (tenantLoading || menuLoading || tableLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="size-8 text-orange-500 animate-spin" />
        <span className="text-muted-foreground">Loading billing profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Billing & Subscription</h3>
        <p className="text-sm text-muted-foreground">Manage your TableTrack subscription to unlock restaurant ordering features.</p>
      </div>

      {/* Subscription Status Warning Alert */}
      {!isPro && (
        <div className="border border-amber-500/20 bg-amber-500/10 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-400">Subscription Required</h4>
            <p className="text-sm text-slate-300 mt-1">
              Your account is currently inactive. Please subscribe to the Pro plan below to access the Menu, Tables, and Live Ordering features.
            </p>
          </div>
        </div>
      )}

      {/* Pro Plan Card Section */}
      <div className="flex justify-center mt-6">
        {/* Pro Plan Card */}
        <Card className={cn(
          "border-border/80 relative flex flex-col justify-between overflow-hidden transition-all duration-300 w-full max-w-md",
          isPro ? "border-orange-500 border-2 bg-slate-900/30 shadow-orange-500/10" : "border-orange-500/40 bg-slate-900/10 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5"
        )}>
          {isPro ? (
            <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Active Plan
            </div>
          ) : (
            <div className="absolute top-3 right-3 bg-orange-500/10 text-orange-500 text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 border border-orange-500/20">
              <Sparkles className="size-3" /> Recommended
            </div>
          )}
          
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-1.5">
              Pro Tier
            </CardTitle>
            <CardDescription>Everything you need to launch and scale digital restaurant ordering</CardDescription>
            <div className="mt-3 flex items-baseline gap-1 text-slate-100">
              <span className="text-3xl font-extrabold">Rp 450.000</span>
              <span className="text-sm text-muted-foreground">/ bulan</span>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 space-y-3.5">
            <div className="flex items-start gap-2.5 text-sm">
              <Check className="size-4 text-orange-500 shrink-0 mt-0.5" />
              <span><strong>Unlimited</strong> menu items hosting</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Check className="size-4 text-orange-500 shrink-0 mt-0.5" />
              <span><strong>Unlimited</strong> table spot generations</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Check className="size-4 text-orange-500 shrink-0 mt-0.5" />
              <span><strong>Custom Subdomains</strong> mapping (e.g. <code className="text-xs">yourbrand.tabletrack.com</code>)</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Check className="size-4 text-orange-500 shrink-0 mt-0.5" />
              <span><strong>Order alerts & push notifications</strong> enabled</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Check className="size-4 text-orange-500 shrink-0 mt-0.5" />
              <span>Custom logo styling & payment instructions</span>
            </div>
          </CardContent>

          <CardFooter className="pt-4 border-t border-border/30 bg-muted/20">
            {isPro ? (
              <Button disabled className="w-full font-semibold bg-emerald-500 text-white cursor-default">
                Pro Activated ✓
              </Button>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20"
              >
                {upgrading ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Loader2 className="size-4 animate-spin" /> Upgrading...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 justify-center">
                    <CreditCard className="size-4" /> Subscribe to Pro
                  </span>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
