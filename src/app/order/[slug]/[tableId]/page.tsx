/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  ChefHat, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Search, 
  X, 
  Check, 
  UtensilsCrossed 
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";

interface MenuVariantOption {
  id: string;
  label: string;
  price_add: number;
}

interface MenuVariant {
  id: string;
  name: string;
  is_required: boolean;
  menu_variant_option: MenuVariantOption[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: any;
  category_id: string;
  category: { name: string } | null;
  menu_variant?: MenuVariant[];
}

interface CartItem {
  id: string; // unique cart item id: menuItem.id + "_" + (optionId || "none")
  menuItem: MenuItem;
  qty: number;
  optionId: string | null;
  optionLabel: string | null;
  optionPriceAdd: number;
  notes: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getImages = (imageUrl: any): string[] => {
  if (!imageUrl) return [];
  if (Array.isArray(imageUrl)) {
    return imageUrl.length > 0 ? imageUrl : [];
  }
  if (typeof imageUrl === "string") {
    if (imageUrl.startsWith("[")) {
      try {
        const parsed = JSON.parse(imageUrl);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [imageUrl];
  }
  return [];
};

export default function OrderMenuPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const tableId = params.tableId as string;

  const [tenant, setTenant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableSpot, setTableSpot] = useState<any>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Variant Customization Modal State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [customizingNotes, setCustomizingNotes] = useState<string>("");
  const [customizingQty, setCustomizingQty] = useState<number>(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        
        // 1. Fetch Tenant
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenant")
          .select("*")
          .eq("slug", slug)
          .single();
          
        if (tenantError) throw tenantError;
        setTenant(tenantData);

        // 2. Fetch Table Spot (only if tableId is a valid UUID and not "new-order")
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableId);
        if (tableId && tableId !== "new-order" && isUuid) {
          const { data: tableData } = await supabase
            .from("table_spot")
            .select("*")
            .eq("id", tableId)
            .single();
          setTableSpot(tableData);
        } else {
          setTableSpot(null);
        }

        // 3. Fetch Categories
        const { data: catData } = await supabase
          .from("category")
          .select("*")
          .eq("tenant_id", tenantData.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        setCategories(catData || []);

        // 4. Fetch Menu Items (Fruits) with nested variants & options
        const { data: menuData } = await supabase
          .from("menu_item")
          .select(`
            *,
            category(name),
            menu_variant(
              id,
              name,
              is_required,
              menu_variant_option(
                id,
                label,
                price_add
              )
            )
          `)
          .eq("tenant_id", tenantData.id)
          .eq("is_available", true);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMenuItems((menuData || []).map((m: any) => ({
          ...m,
          category: m.category ? { name: m.category.name } : null
        })));

      } catch (err: any) {
        console.error("Error loading shop details:", err);
        toast.error("Failed to load restaurant menu.");
      } finally {
        setLoading(false);
      }
    };

    if (slug && tableId) {
      loadData();
    }
  }, [slug, tableId]);

  const getOptionsForMenuItem = (item: MenuItem) => {
    if (!item.menu_variant) return [];
    const options: any[] = [];
    item.menu_variant.forEach((variant) => {
      variant.menu_variant_option?.forEach((opt) => {
        options.push({
          id: opt.id,
          variantName: variant.name,
          label: opt.label,
          price_add: opt.price_add,
        });
      });
    });
    return options;
  };

  const getItemCountInCart = (menuItemId: string) => {
    return cart
      .filter((c) => c.menuItem.id === menuItemId)
      .reduce((sum, c) => sum + c.qty, 0);
  };

  const handleCustomizeClick = (item: MenuItem) => {
    const options = getOptionsForMenuItem(item);
    setCustomizingItem(item);
    setCustomizingQty(1);
    setCustomizingNotes("");
    if (options.length > 0) {
      setSelectedOptionId(options[0].id);
    } else {
      setSelectedOptionId("");
    }
  };

  const addToCart = (
    menuItem: MenuItem,
    optionId: string | null = null,
    optionLabel: string | null = null,
    optionPriceAdd: number = 0
  ) => {
    const cartItemId = `${menuItem.id}_${optionId || "none"}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          menuItem,
          qty: 1,
          optionId,
          optionLabel,
          optionPriceAdd,
          notes: "",
        },
      ];
    });
    toast.success(`${menuItem.name}${optionLabel ? ` (${optionLabel})` : ""} added to cart!`);
  };

  const updateQty = (cartItemId: string, amount: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.qty + amount;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const updateItemNotes = (cartItemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, notes } : item
      )
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.qty * (item.menuItem.price + item.optionPriceAdd),
    0
  );

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setCheckoutLoading(true);
    try {
      const supabase = createClient();

      const orderBody = {
        table_id: (tableId && tableId !== "new-order") ? tableId : null,
        status: "pending" as const,
        notes: `${customerName.trim()}'s Online Order. Notes: ${orderNotes.trim() || "None"}`,
        total_amount: cartTotal,
        tenant_id: tenant.id,
      };

      // 1. Create order
      const { data: orderData, error: orderError } = await supabase
        .from("order_table")
        .insert(orderBody)
        .select()
        .single();

      if (orderError) throw orderError;
      const orderId = orderData.id;

      // 2. Create order items
      const orderItems = cart.map((item) => ({
        order_id: orderId,
        menu_item_id: item.menuItem.id,
        option_id: item.optionId,
        qty: item.qty,
        unit_price: item.menuItem.price + item.optionPriceAdd,
        notes: item.notes || null,
        tenant_id: tenant.id,
      }));

      const { error: itemsError } = await supabase
        .from("order_item")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success("Order placed successfully!");
      setCart([]);
      setIsCartOpen(false);
      
      // Redirect to real-time status page
      router.push(`/order/${slug}/${tableId}/status?order_id=${orderId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm font-medium">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Banner / Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              {tenant?.name || "Fruits Ordering"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tableSpot ? `Table Spot: ${tableSpot.name}` : "Online Ordering"}
            </p>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            aria-label="View cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search delicious fruits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>
          
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all",
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              )}
            >
              All Fruits
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        {filteredMenuItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredMenuItems.map((item) => {
              const images = getImages(item.image_url);
              const firstImage = images.length > 0 ? images[0] : "";
              const cartItem = cart.find((c) => c.menuItem.id === item.id && !c.optionId);
              const hasOptions = getOptionsForMenuItem(item).length > 0;

              return (
                <div
                  key={item.id}
                  className="group bg-card rounded-2xl overflow-hidden border border-border/80 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow"
                >
                  <div className="relative w-full aspect-[4/3] bg-muted/30 overflow-hidden">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-primary/10 via-secondary/15 to-accent/10 text-primary/40 p-4">
                        <ChefHat className="h-10 w-10 mb-1" />
                        <span className="text-[10px] font-semibold text-muted-foreground">Fresh Produce</span>
                      </div>
                    )}
                    
                    {item.category?.name && (
                      <span className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {item.category.name}
                      </span>
                    )}

                    {item.stock <= 5 && item.stock > 0 && (
                      <span className="absolute top-3 right-3 bg-yellow-500 text-yellow-950 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-yellow-400/30">
                        Only {item.stock} left
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-foreground text-base group-hover:text-primary transition-colors line-clamp-1">
                        {item.name}
                      </h4>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.stock > 0 ? (
                          <span className="text-emerald-600 font-medium">In Stock</span>
                        ) : (
                          <span className="text-destructive font-semibold">Out of Stock</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <span className="text-base font-extrabold text-foreground">
                        {formatCurrency(item.price)}
                      </span>

                      {item.stock > 0 ? (
                        hasOptions ? (
                          <button
                            onClick={() => handleCustomizeClick(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Customize</span>
                            {getItemCountInCart(item.id) > 0 && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                {getItemCountInCart(item.id)}
                              </span>
                            )}
                          </button>
                        ) : cartItem ? (
                          <div className="flex items-center gap-2.5 bg-primary text-primary-foreground px-2.5 py-1.5 rounded-xl border border-primary shadow-sm">
                            <button
                              onClick={() => updateQty(cartItem.id, -1)}
                              className="hover:scale-110 active:scale-95 transition-transform"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-xs font-bold font-mono min-w-[12px] text-center">
                              {cartItem.qty}
                            </span>
                            <button
                              onClick={() => updateQty(cartItem.id, 1)}
                              className="hover:scale-110 active:scale-95 transition-transform"
                              disabled={cartItem.qty >= item.stock}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-sm"
                            aria-label="Add to cart"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )
                      ) : (
                        <button
                          disabled
                          className="px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold border cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border/60 rounded-3xl p-12 text-center max-w-md mx-auto">
            <ChefHat className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h5 className="font-bold text-foreground text-lg">No fruits found</h5>
            <p className="text-muted-foreground text-sm mt-1">
              Try adjusting your filters or search keywords.
            </p>
          </div>
        )}
      </main>

      {/* Cart Modal / Sidebar Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-background h-full flex flex-col shadow-2xl border-l border-border z-10 animate-in slide-in-from-right duration-250">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h3 className="font-extrabold text-foreground text-base">Your Cart ({cartCount})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close cart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length > 0 ? (
                cart.map((item) => {
                  const images = getImages(item.menuItem.image_url);
                  const firstImage = images.length > 0 ? images[0] : "";
                  
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 bg-muted/20 border border-border/50 p-3.5 rounded-xl"
                    >
                      <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={item.menuItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                            <ChefHat className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h5 className="font-bold text-foreground text-sm line-clamp-1">{item.menuItem.name}</h5>
                            {item.optionLabel && (
                              <span className="text-[10px] font-semibold text-primary block mt-0.5">
                                {item.optionLabel}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-extrabold text-foreground font-mono">
                            {formatCurrency((item.menuItem.price + item.optionPriceAdd) * item.qty)}
                          </span>
                        </div>

                        {/* Quantity controls and item notes */}
                        <div className="flex items-center justify-between mt-2 gap-4">
                          <input
                            type="text"
                            placeholder="Add request (e.g. less sweet)..."
                            value={item.notes}
                            onChange={(e) => updateItemNotes(item.id, e.target.value)}
                            className="bg-transparent border-b border-border/60 pb-0.5 text-xs text-muted-foreground flex-1 focus:outline-none focus:border-primary focus:ring-0 max-w-[150px] sm:max-w-none"
                          />

                          <div className="flex items-center gap-2 bg-primary/10 text-primary px-2 py-1 rounded-lg">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              className="hover:scale-115 active:scale-90"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold font-mono min-w-[10px] text-center">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="hover:scale-115 active:scale-90"
                              disabled={item.qty >= item.menuItem.stock}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <h4 className="font-bold text-foreground">Your cart is empty</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Go back to the menu to add fresh organic fruits.
                  </p>
                </div>
              )}
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="p-4 border-t border-border space-y-4 bg-muted/15">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="customer-name" className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Your Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="order-notes" className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      id="order-notes"
                      rows={2}
                      placeholder="e.g. Please wrap carefully, deliver to desk 2..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="border-t border-border/80 pt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Service Fee / Tax</span>
                    <span className="font-mono">Free</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-foreground border-t border-border/50 pt-2">
                    <span>Total Amount</span>
                    <span className="text-primary font-mono">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-99 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Place Order
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar (shows on mobile when cart is closed) */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-background via-background/95 to-transparent">
          <button
            onClick={() => setIsCartOpen(true)}
            className="max-w-md mx-auto w-full py-3.5 px-5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all flex items-center justify-between shadow-lg hover:scale-[1.01] active:scale-99 animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-extrabold text-primary font-mono">
                {cartCount}
              </span>
              <span className="text-sm">View Basket</span>
            </div>
            <span className="text-sm font-extrabold font-mono">{formatCurrency(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Customization Dialog */}
      <Dialog
        open={customizingItem !== null}
        onOpenChange={(open) => {
          if (!open) setCustomizingItem(null);
        }}
      >
        <DialogContent className="max-w-md w-full p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Customize {customizingItem?.name}
            </DialogTitle>
          </DialogHeader>
          
          {customizingItem && (
            <div className="space-y-5 mt-2">
              {/* Item Image and Price */}
              <div className="flex gap-4 items-center bg-muted/20 p-3 rounded-xl border border-border/50">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {getImages(customizingItem.image_url)[0] ? (
                    <img
                      src={getImages(customizingItem.image_url)[0]}
                      alt={customizingItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <ChefHat className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-foreground">{customizingItem.name}</div>
                  <div className="text-sm font-semibold text-muted-foreground mt-0.5">
                    Base: {formatCurrency(customizingItem.price)}
                  </div>
                </div>
              </div>

              {/* Options List */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Choose Option
                </label>
                <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                  {getOptionsForMenuItem(customizingItem).map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={cn(
                          "flex justify-between items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-border/60 bg-card hover:bg-muted/30"
                        )}
                      >
                        <div>
                          <span className="text-xs text-muted-foreground block font-medium">
                            {opt.variantName}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {opt.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {opt.price_add > 0 && (
                            <span className="text-xs font-bold text-emerald-600">
                              +{formatCurrency(opt.price_add)}
                            </span>
                          )}
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full border flex items-center justify-center",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customization Quantity and Notes */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3 bg-muted px-3 py-1.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setCustomizingQty((q) => Math.max(1, q - 1))}
                      className="hover:scale-110 active:scale-95 text-foreground hover:bg-transparent"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-bold font-mono min-w-[15px] text-center">
                      {customizingQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomizingQty((q) => Math.min(customizingItem.stock, q + 1))}
                      className="hover:scale-110 active:scale-95 text-foreground hover:bg-transparent"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Special Notes (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. less sweet, ripe fruit..."
                    value={customizingNotes}
                    onChange={(e) => setCustomizingNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                  />
                </div>
              </div>

              {/* Add to Cart button */}
              <button
                type="button"
                onClick={() => {
                  if (!selectedOptionId) {
                    toast.error("Please select an option");
                    return;
                  }
                  const options = getOptionsForMenuItem(customizingItem);
                  const selectedOpt = options.find((o) => o.id === selectedOptionId);
                  if (!selectedOpt) return;

                  // Add customizingQty times to cart
                  const cartItemId = `${customizingItem.id}_${selectedOptionId}`;
                  setCart((prev) => {
                    const existing = prev.find((item) => item.id === cartItemId);
                    if (existing) {
                      return prev.map((item) =>
                        item.id === cartItemId
                          ? { ...item, qty: item.qty + customizingQty, notes: customizingNotes || item.notes }
                          : item
                      );
                    }
                    return [
                      ...prev,
                      {
                        id: cartItemId,
                        menuItem: customizingItem,
                        qty: customizingQty,
                        optionId: selectedOptionId,
                        optionLabel: `${selectedOpt.variantName}: ${selectedOpt.label}`,
                        optionPriceAdd: selectedOpt.price_add,
                        notes: customizingNotes,
                      },
                    ];
                  });

                  toast.success(
                    `${customizingItem.name} (${selectedOpt.variantName}: ${selectedOpt.label}) added to cart!`
                  );
                  setCustomizingItem(null);
                }}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all text-sm shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add to Cart</span>
                <span className="mx-1 opacity-40">|</span>
                <span className="font-mono">
                  {formatCurrency(
                    (customizingItem.price +
                      (getOptionsForMenuItem(customizingItem).find((o) => o.id === selectedOptionId)
                        ?.price_add || 0)) *
                      customizingQty
                  )}
                </span>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
