"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  UtensilsCrossed,
  Sparkles,
  Smartphone,
  BellRing,
  Globe2,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Utensils,
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  ChevronRight,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MockProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  rating: number;
}

const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "1",
    name: "Classic Cheeseburger",
    price: 12.99,
    category: "Mains",
    image: "🍔",
    rating: 4.8
  },
  {
    id: "2",
    name: "Truffle Parmesan Fries",
    price: 6.49,
    category: "Sides",
    image: "🍟",
    rating: 4.9
  },
  {
    id: "3",
    name: "Matcha Iced Latte",
    price: 4.99,
    category: "Drinks",
    image: "🍵",
    rating: 4.7
  }
];

export default function LandingPage() {
  // Mobile preview simulator state
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [activeCategory, setActiveCategory] = useState("Mains");

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[id] <= 1) {
        delete updated[id];
      } else {
        updated[id]--;
      }
      return updated;
    });
  };

  const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = MOCK_PRODUCTS.find((p) => p.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background glowing gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] bg-accent/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-[10%] left-[-5%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[110px] -z-10" />

      {/* Header/Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-all">
              <UtensilsCrossed className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              TableTrack
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#interactive-demo" className="hover:text-primary transition-colors">Live Demo</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-xl shadow-md transition-all hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
            <Sparkles className="size-3.5" /> Fast, Contactless QR Menu & Ordering
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Elevate Your Dining Experience with{" "}
            <span className="text-primary bg-clip-text">
              Self-Ordering
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            Empower your customers to scan, browse, customize, and order instantly from their tables. Boost table turnover, cut cashier overhead, and delight diners.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link
              href="/auth/register"
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary/10 text-base transition-all hover:-translate-y-0.5"
            >
              Start Free Trial <ArrowRight className="size-5" />
            </Link>
            <a
              href="#interactive-demo"
              className="flex items-center justify-center gap-2 border border-input bg-background hover:bg-accent text-accent-foreground font-semibold px-8 py-4 rounded-xl transition-all"
            >
              Try Interactive Demo
            </a>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-6 pt-6 border-t border-border">
            <div className="flex -space-x-2">
              <span className="w-8 h-8 rounded-full bg-muted border border-background flex items-center justify-center text-xs">🍕</span>
              <span className="w-8 h-8 rounded-full bg-muted border border-background flex items-center justify-center text-xs">🍣</span>
              <span className="w-8 h-8 rounded-full bg-muted border border-background flex items-center justify-center text-xs">🌮</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="size-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Trusted by growing restaurants worldwide</p>
            </div>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="w-[300px] h-[600px] bg-card rounded-[40px] p-3.5 border-4 border-border shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Camera notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-4 bg-background border border-border rounded-full z-20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-muted rounded-full" />
            </div>

            {/* Mobile UI Screen Mock */}
            <div className="flex-1 bg-background rounded-[30px] p-4 pt-6 overflow-y-auto space-y-4 no-scrollbar">
              <div className="flex items-between justify-between">
                <div>
                  <h4 className="text-[10px] text-muted-foreground font-semibold uppercase">TABLE SPOT: A1</h4>
                  <h3 className="font-bold text-sm text-foreground">Bella Italia Bistro</h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">BI</div>
              </div>

              {/* Banner */}
              <div className="bg-primary text-primary-foreground rounded-xl p-3 space-y-1">
                <span className="text-[9px] font-mono tracking-wider font-semibold uppercase bg-black/10 px-1.5 py-0.5 rounded">Special Promo</span>
                <h5 className="font-bold text-xs">20% off Gourmet Pastas</h5>
                <p className="text-[9px] text-primary-foreground/80">Valid for dine-in orders today only</p>
              </div>

              {/* Categories */}
              <div className="flex gap-2 text-[10px] font-semibold overflow-x-auto pb-1">
                <span className="bg-primary text-primary-foreground px-2.5 py-1 rounded-full whitespace-nowrap">🍕 Pizza</span>
                <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full whitespace-nowrap">🍝 Pasta</span>
                <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full whitespace-nowrap">🍷 Wine</span>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="bg-card border border-border rounded-xl p-2.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h6 className="font-bold text-xs text-card-foreground">Margherita Pizza</h6>
                    <p className="text-[10px] text-muted-foreground">$11.99</p>
                  </div>
                  <button className="bg-primary text-primary-foreground rounded-lg p-1.5 text-xs font-bold transition-all">+</button>
                </div>
                <div className="bg-card border border-border rounded-xl p-2.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h6 className="font-bold text-xs text-card-foreground">Truffle Carbonara</h6>
                    <p className="text-[10px] text-muted-foreground">$14.49</p>
                  </div>
                  <button className="bg-primary text-primary-foreground rounded-lg p-1.5 text-xs font-bold transition-all">+</button>
                </div>
              </div>

              {/* Live Status Tracker widget */}
              <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-semibold text-primary flex items-center gap-1">
                    <Clock className="size-3 animate-pulse" /> Order #1042
                  </span>
                  <span className="text-muted-foreground">Cooking</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1">
                  <div className="bg-primary h-1 rounded-full w-[65%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute bottom-6 right-[-20px] bg-card border border-border p-4 rounded-2xl shadow-xl space-y-1.5 max-w-[160px] backdrop-blur-md hidden sm:block animate-bounce" style={{ animationDuration: "5s" }}>
            <span className="text-xs text-muted-foreground">Average Order Value</span>
            <h4 className="text-xl font-extrabold text-foreground flex items-center gap-1">
              +28% <TrendingUp className="size-4 text-emerald-500" />
            </h4>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-border relative">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Designed for Modern Restorateurs
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Everything you need to turn tables into smart interactive nodes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="border border-border bg-card/60 p-6 rounded-2xl space-y-4 hover:border-primary/20 hover:bg-accent/40 transition-all duration-300">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
              <QrCode className="size-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">QR Code Spot Generator</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Generate custom branded QR code spots for tables, bar stools, or rooms instantly in high resolution.
            </p>
          </div>

          {/* Card 2 */}
          <div className="border border-border bg-card/60 p-6 rounded-2xl space-y-4 hover:border-primary/20 hover:bg-accent/40 transition-all duration-300">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
              <BellRing className="size-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Real-Time Kitchen Alerts</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Staff and kitchen teams receive instant sound alerts and push notifications as soon as customers hit submit.
            </p>
          </div>

          {/* Card 3 */}
          <div className="border border-border bg-card/60 p-6 rounded-2xl space-y-4 hover:border-primary/20 hover:bg-accent/40 transition-all duration-300">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Globe2 className="size-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Custom Brand Domain</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Direct customers to your customized subdomain mapping (e.g. <code className="text-primary font-semibold">menu.yourbistro.com</code>) for a fully white-labeled feel.
            </p>
          </div>

          {/* Card 4 */}
          <div className="border border-border bg-card/60 p-6 rounded-2xl space-y-4 hover:border-primary/20 hover:bg-accent/40 transition-all duration-300">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Secure Checkout Gate</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Integrate with premium digital banking checkouts like Midtrans / Stripe directly, letting diners settle the bill at checkout.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Mobile Ordering Simulator */}
      <section id="interactive-demo" className="bg-accent/10 border-y border-border py-20 relative">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Smartphone className="size-3" /> Live Simulation
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              Test Drive the Customer Experience
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Experience the fast, frictionless customer-facing menu first-hand. Add items to your cart on the mobile mockup to see how easy it is for diners to build their custom orders.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="flex items-center justify-center size-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">1</span>
                <p className="text-muted-foreground text-sm">Select items on the mobile screen simulation</p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center justify-center size-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">2</span>
                <p className="text-muted-foreground text-sm">Tap variables & manage quantities instantly</p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center justify-center size-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">3</span>
                <p className="text-muted-foreground text-sm">Watch the real-time subtotal and review order summary</p>
              </div>
            </div>
          </div>

          {/* SIMULATOR DEVICE CONTAINER */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-[330px] h-[620px] bg-card rounded-[44px] p-4 border-[6px] border-border shadow-2xl relative overflow-hidden flex flex-col justify-between">
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-5 bg-background border border-border rounded-full z-20 flex items-center justify-center">
                <div className="w-3 h-3 bg-muted rounded-full mr-2" />
                <div className="w-1.5 h-1.5 bg-muted rounded-full" />
              </div>

              {/* Mobile Live Screen */}
              <div className="flex-1 bg-background rounded-[32px] p-4 pt-8 overflow-y-auto space-y-4 flex flex-col justify-between select-none">
                
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Dine-In • Table Spot A3</span>
                      <h4 className="text-sm font-black text-foreground">Gourmet Haven Bar & Grill</h4>
                    </div>
                    <Heart className="size-4 text-red-500 fill-red-500/10" />
                  </div>

                  {/* Search bar simulation */}
                  <div className="bg-muted rounded-xl px-3 py-2 text-xs text-muted-foreground flex items-center justify-between border border-border">
                    <span>Search for burgers, drinks...</span>
                    <Utensils className="size-3.5" />
                  </div>

                  {/* Menu filters */}
                  <div className="flex gap-2 pb-1 overflow-x-auto text-[10px] font-bold">
                    {["Mains", "Sides", "Drinks"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-full transition-all border",
                          activeCategory === cat
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-muted border-border text-muted-foreground"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Product Lists matching Category */}
                  <div className="space-y-2.5">
                    {MOCK_PRODUCTS.filter((p) => p.category === activeCategory).map((product) => {
                      const qty = cart[product.id] || 0;
                      return (
                        <div
                          key={product.id}
                          className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 hover:border-primary/20 transition-all"
                        >
                          <div className="text-2xl w-11 h-11 bg-muted border border-border rounded-xl flex items-center justify-center shrink-0">
                            {product.image}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="font-bold text-xs text-card-foreground truncate">{product.name}</h5>
                              <span className="text-[10px] font-bold text-primary shrink-0">${product.price}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center gap-1">
                                <Star className="size-2.5 fill-amber-500 text-amber-500" />
                                <span className="text-[9px] text-muted-foreground font-semibold">{product.rating}</span>
                              </div>
                              
                              {/* Quantity control */}
                              {qty > 0 ? (
                                <div className="flex items-center gap-2 bg-background rounded-lg p-0.5 border border-border">
                                  <button
                                    onClick={() => removeFromCart(product.id)}
                                    className="p-1 text-muted-foreground hover:text-foreground rounded"
                                  >
                                    <Minus className="size-2.5" />
                                  </button>
                                  <span className="text-[10px] font-bold text-foreground px-1">{qty}</span>
                                  <button
                                    onClick={() => addToCart(product.id)}
                                    className="p-1 text-muted-foreground hover:text-foreground rounded"
                                  >
                                    <Plus className="size-2.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(product.id)}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all flex items-center gap-0.5"
                                >
                                  Add <Plus className="size-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subtotal overlay footer */}
                <div className="mt-4 border-t border-border pt-3">
                  {cartTotalItems > 0 ? (
                    <button className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-xl flex items-center justify-between text-xs font-bold shadow-lg">
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="size-4" />
                        <span>View Cart ({cartTotalItems})</span>
                      </span>
                      <span>Total: ${cartTotalPrice.toFixed(2)}</span>
                    </button>
                  ) : (
                    <div className="text-center py-2 text-[10px] text-muted-foreground">
                      Your cart is empty. Choose food to order.
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24 relative">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
            One Plan. Total Control.
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            No locked features, no transaction cut, no hidden fees. Paid first model lets you test and deploy with zero boundaries.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="border-2 border-primary bg-card p-8 rounded-3xl w-full max-w-md relative overflow-hidden shadow-xl shadow-primary/5">
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Popular Plan
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                Pro Subscription
              </h3>
              <p className="text-muted-foreground text-sm">For growing cafes, diners, and restaurant venues looking to streamline customer order speeds.</p>
              <div className="py-4 flex items-baseline gap-1.5 text-foreground">
                <span className="text-5xl font-black tracking-tight">$29</span>
                <span className="text-base text-muted-foreground">/ month</span>
              </div>
            </div>

            <hr className="border-border my-6" />

            <div className="space-y-4 mb-8 text-foreground">
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <span><strong>Unlimited</strong> menu categories & items</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <span><strong>Unlimited</strong> table spot generations</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <span><strong>Custom Subdomains</strong> mapping configuration</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <span><strong>Real-time push notifications</strong> alerts for staff</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <span>Kitchen & Cashier tracking dashboard access</span>
              </div>
            </div>

            <Link
              href="/auth/register"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-0.5 text-base"
            >
              Get Started Now <ChevronRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12 text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <UtensilsCrossed className="size-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground">TableTrack</span>
          </div>

          <p className="text-xs">&copy; {new Date().getFullYear()} TableTrack Inc. All rights reserved.</p>

          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
