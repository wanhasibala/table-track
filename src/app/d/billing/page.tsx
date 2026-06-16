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
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Billing & Subscription</h3>
        <p className="text-sm text-muted-foreground">Manage your subscription tier, billing methods, and resource usage.</p>
      </div>

      {/* Usage summary widget */}
      <Card className="border-border/80 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Resource Usage Summary
            {!isPro && (
              <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                Free Tier Limits Active
              </span>
            )}
          </CardTitle>
          <CardDescription>Monitor your active store resource caps</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          {/* Menu items meter */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>Menu Items</span>
              <span className="text-muted-foreground">
                {menuItemsCount} / {isPro ? "Unlimited" : "5 items"}
              </span>
            </div>
            <Progress value={menuPercent} className={cn("h-2", isPro ? "bg-slate-200" : menuPercent >= 100 ? "bg-red-500" : "bg-orange-500")} />
            {!isPro && menuItemsCount >= 5 && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <ShieldAlert className="size-3.5" /> Menu cap reached. Upgrade to add more items.
              </p>
            )}
          </div>

          {/* Table spots meter */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>Table Spots</span>
              <span className="text-muted-foreground">
                {tableSpotsCount} / {isPro ? "Unlimited" : "3 tables"}
              </span>
            </div>
            <Progress value={tablePercent} className={cn("h-2", isPro ? "bg-slate-200" : tablePercent >= 100 ? "bg-red-500" : "bg-orange-500")} />
            {!isPro && tableSpotsCount >= 3 && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <ShieldAlert className="size-3.5" /> Table cap reached. Upgrade to add more spots.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan comparisons grid */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Free Plan Card */}
        <Card className={cn(
          "border-border/80 relative flex flex-col justify-between overflow-hidden",
          !isPro && "border-orange-500/25 shadow-orange-500/5 bg-slate-900/10"
        )}>
          {!isPro && (
            <div className="absolute top-3 right-3 bg-orange-500/10 text-orange-500 text-[10px] px-2 py-0.5 rounded font-mono font-semibold border border-orange-500/20">
              Active Plan
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-xl">Free Tier</CardTitle>
            <CardDescription>Perfect for testing and small venues</CardDescription>
            <div className="mt-3 flex items-baseline gap-1 text-slate-100">
              <span className="text-3xl font-extrabold">$0</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-3.5">
            <div className="flex items-start gap-2.5 text-sm">
              <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Up to <strong>5 menu items</strong> hosting</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Up to <strong>3 table spots</strong> generation</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Standard scan QR customer menu access</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Path-based URLs only (<code className="text-xs">/order/slug</code>)</span>
            </div>
          </CardContent>
          <CardFooter className="pt-4 border-t border-border/30 bg-muted/20">
            <Button disabled className="w-full font-semibold" variant="outline">
              {!isPro ? "Current Active Plan" : "Downgrade Unavailable"}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan Card */}
        <Card className={cn(
          "border-border/80 relative flex flex-col justify-between overflow-hidden transition-all duration-300",
          isPro ? "border-orange-500 border-2 bg-slate-900/30 shadow-orange-500/10" : "hover:border-orange-500/40 hover:-translate-y-0.5"
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
            <CardDescription>For growing businesses looking to scale ordering</CardDescription>
            <div className="mt-3 flex items-baseline gap-1 text-slate-100">
              <span className="text-3xl font-extrabold">$29</span>
              <span className="text-sm text-muted-foreground">/ month</span>
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
              <span><strong>Custom Subdomains</strong> mapping (e.g. <code className="text-xs">misenary.localhost</code>)</span>
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
                    <CreditCard className="size-4" /> Upgrade to Pro
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
