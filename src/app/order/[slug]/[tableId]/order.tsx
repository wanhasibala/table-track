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
  UtensilsCrossed,
  MapPin,
  Navigation,
  LayoutGrid,
  List,
  Calendar,
  CalendarDays,
  Clock,
} from "lucide-react";
import {
  createScheduleNoteTag,
  combineDateAndTimeToIso,
} from "@/utils/order-schedule";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import Image from "next/image";

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

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getDayAfterTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatSchedulePreview = (dateStr: string, timeStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const time = timeStr ? ` pukul ${timeStr}` : "";
  const dayName = d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${dayName}${time}`;
};

export default function OrderMenuPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const tableId = (params.tableId ||
    searchParams.get("tableId") ||
    searchParams.get("table_id") ||
    "new-order") as string;

  const [tenant, setTenant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableSpot, setTableSpot] = useState<any>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Schedule Order State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(getTomorrowString());
  const [scheduleTime, setScheduleTime] = useState("12:00");

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Variant Customization Modal State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [customizingNotes, setCustomizingNotes] = useState<string>("");
  const [customizingQty, setCustomizingQty] = useState<number>(1);

  // Delivery State
  const [orderType, setOrderType] = useState<
    "dine_in" | "takeaway" | "delivery"
  >(tableId === "new-order" ? "takeaway" : "dine_in");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number | null>(
    null,
  );
  const [deliveryDurationText, setDeliveryDurationText] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(
    null,
  );
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);

  const checkDeliveryDetails = async (
    addressToCalculate?: string,
    coords?: { lat: number; lng: number },
  ) => {
    const targetAddress =
      addressToCalculate !== undefined ? addressToCalculate : deliveryAddress;

    if (!targetAddress && !coords) {
      toast.error(
        "Please enter a delivery address or use your current location",
      );
      return;
    }

    setCalculatingDelivery(true);
    setDeliveryError(null);

    try {
      const response = await fetch("/api/delivery/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: targetAddress,
          latitude: coords?.lat,
          longitude: coords?.lng,
          tenantId: tenant?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not calculate delivery details.",
        );
      }

      setDeliveryFee(data.deliveryFee);
      setDeliveryDistanceKm(data.distanceKm);
      setDeliveryDurationText(data.durationText);
      setDeliveryLatitude(data.latitude);
      setDeliveryLongitude(data.longitude);
      if (data.address) {
        setDeliveryAddress(data.address);
      }
      toast.success(`Delivery calculated: ${data.distanceKm} km away`);
    } catch (err: any) {
      console.error(err);
      setDeliveryError(err.message || "Failed to calculate delivery fee.");
      setDeliveryFee(0);
      setDeliveryDistanceKm(null);
      setDeliveryDurationText("");
      setDeliveryLatitude(null);
      setDeliveryLongitude(null);
      toast.error(err.message || "Delivery calculation failed.");
    } finally {
      setCalculatingDelivery(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocatingUser(true);
    setDeliveryError(null);
    toast.info("Requesting location access...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        toast.success("Location acquired! Calculating delivery...");
        setLocatingUser(false);
        await checkDeliveryDetails(undefined, {
          lat: latitude,
          lng: longitude,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocatingUser(false);
        let msg = "Could not get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg =
            "Location permission denied. Please enter your address manually.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg =
            "Location information is unavailable. Please enter your address manually.";
        } else if (error.code === error.TIMEOUT) {
          msg =
            "Location request timed out. Please enter your address manually.";
        }
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();

        // 1. Fetch Tenant
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenant")
          .select("*")
          .ilike("slug", slug)
          .maybeSingle();

        if (tenantError) throw tenantError;
        setTenant(tenantData);

        if (!tenantData) {
          setLoading(false);
          return;
        }

        // 2. Fetch Table Spot (by UUID or name)
        if (tableId && tableId !== "new-order") {
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              tableId,
            );

          let tableQuery = supabase
            .from("table_spot")
            .select("*")
            .eq("tenant_id", tenantData.id);

          if (isUuid) {
            tableQuery = tableQuery.eq("id", tableId);
          } else {
            const formattedName = tableId.replace(/[-_]/g, " ").trim();
            tableQuery = tableQuery.or(
              `name.ilike.${tableId},name.ilike.${formattedName},name.ilike.Table ${tableId},name.ilike.Meja ${tableId}`,
            );
          }

          const { data: tableData } = await tableQuery.maybeSingle();
          setTableSpot(tableData || null);
          if (tableData) {
            setOrderType("dine_in");
          }
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
          .select(
            `
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
          `,
          )
          .eq("tenant_id", tenantData.id)
          .eq("is_available", true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMenuItems(
          (menuData || []).map((m: any) => ({
            ...m,
            category: m.category ? { name: m.category.name } : null,
          })),
        );
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
    optionPriceAdd: number = 0,
  ) => {
    const cartItemId = `${menuItem.id}_${optionId || "none"}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, qty: item.qty + 1 } : item,
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
    toast.success(
      `${menuItem.name}${optionLabel ? ` (${optionLabel})` : ""} added to cart!`,
    );
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
      prev.map((item) => (item.id === cartItemId ? { ...item, notes } : item)),
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.qty * (item.menuItem.price + item.optionPriceAdd),
    0,
  );

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
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

    if (orderType === "delivery") {
      if (!deliveryAddress.trim()) {
        toast.error("Please enter your delivery address");
        return;
      }
      if (!customerPhone.trim()) {
        toast.error("Please enter your phone number for delivery updates");
        return;
      }
      if (deliveryDistanceKm === null) {
        toast.error("Please calculate your delivery fee first");
        return;
      }
      if (deliveryError) {
        toast.error(`Cannot place order: ${deliveryError}`);
        return;
      }
    }

    if (isScheduled) {
      if (!scheduleDate) {
        toast.error("Please select a date for your scheduled order");
        return;
      }
      if (!scheduleTime) {
        toast.error("Please select a time for your scheduled order");
        return;
      }

      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      const now = new Date();
      if (scheduledDateTime.getTime() <= now.getTime()) {
        toast.error("Scheduled time must be in the future. Please pick an upcoming date or time.");
        return;
      }
    }

    setCheckoutLoading(true);
    try {
      const supabase = createClient();

      const scheduleIso = isScheduled
        ? combineDateAndTimeToIso(scheduleDate, scheduleTime)
        : null;
      const schedulePrefix = isScheduled
        ? `${createScheduleNoteTag(scheduleDate, scheduleTime)} `
        : "";

      const orderBody: any = {
        table_id:
          orderType === "dine_in"
            ? tableSpot?.id || (tableId !== "new-order" ? tableId : null)
            : null,
        status: "pending" as const,
        notes: `${schedulePrefix}${customerName.trim()}'s Online Order. Notes: ${orderNotes.trim() || "None"}`,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        total_amount: cartTotal + (orderType === "delivery" ? deliveryFee : 0),
        tenant_id: tenant.id,
        type: orderType,
        delivery_fee: orderType === "delivery" ? deliveryFee : 0,
        delivery_address:
          orderType === "delivery" ? deliveryAddress.trim() : null,
        delivery_latitude: orderType === "delivery" ? deliveryLatitude : null,
        delivery_longitude: orderType === "delivery" ? deliveryLongitude : null,
        ...(scheduleIso ? { scheduled_for: scheduleIso } : {}),
      };

      // 1. Create order
      let orderData: any = null;
      const { data: insertedOrder, error: orderError } = await supabase
        .from("order_table")
        .insert(orderBody)
        .select()
        .single();

      if (orderError) {
        // Graceful fallback: if scheduled_for column not present in DB schema cache (PGRST204), retry without it
        if (orderError.code === "PGRST204" && orderBody.scheduled_for) {
          delete orderBody.scheduled_for;
          const retry = await supabase
            .from("order_table")
            .insert(orderBody)
            .select()
            .single();
          if (retry.error) throw retry.error;
          orderData = retry.data;
        } else {
          throw orderError;
        }
      } else {
        orderData = insertedOrder;
      }

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

      // Redirect to real-time payment page
      const isSubdomain =
        typeof window !== "undefined" &&
        Boolean(slug) &&
        window.location.hostname.startsWith(`${slug}.`);

      if (isSubdomain) {
        router.push(`/payment?order_id=${orderId}`);
      } else {
        router.push(`/order/payment?order_id=${orderId}`);
      }
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
        <p className="text-muted-foreground text-sm font-medium">
          Loading menu...
        </p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Restaurant Not Found
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We couldn&apos;t find a restaurant matching &ldquo;{slug}&rdquo;.
            Please verify the URL or scan the QR code again.
          </p>
        </div>
      </div>
    );
  }

  if (tenant.is_active === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Temporarily Closed
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {tenant.name} is currently not accepting online orders. Please check
            back later.
          </p>
        </div>
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
              {tenant?.logo_url ? (
                <Image
                  src={tenant.logo_url || "/default-tenant-logo.png"}
                  alt={tenant.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <UtensilsCrossed className="h-8 w-8 text-primary" />
              )}

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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search delicious fruits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>

            {/* View Switcher */}
            <div className="flex items-center border border-border/70 rounded-xl p-0.5 bg-muted/20 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all",
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted",
              )}
            >
              All Fruits
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Cards */}
        {filteredMenuItems.length > 0 ? (
          viewMode === "grid" ? (
            /* Compact Grid View (2 cols on mobile, 3 on tablet, 4 on desktop) */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredMenuItems.map((item) => {
                const images = getImages(item.image_url);
                const firstImage = images.length > 0 ? images[0] : "";
                const cartItem = cart.find(
                  (c) => c.menuItem.id === item.id && !c.optionId,
                );
                const hasOptions = getOptionsForMenuItem(item).length > 0;

                return (
                  <div
                    key={item.id}
                    className="group bg-card rounded-xl overflow-hidden border border-border/70 shadow-xs flex flex-col justify-between h-full hover:shadow-md hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="relative w-full aspect-[4/3] bg-muted/30 overflow-hidden">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-primary/10 via-secondary/15 to-accent/10 text-primary/40 p-2">
                          <ChefHat className="h-6 w-6 mb-0.5" />
                          <span className="text-[9px] font-semibold text-muted-foreground">
                            Fresh Produce
                          </span>
                        </div>
                      )}

                      {item.category?.name && (
                        <span className="absolute top-2 left-2 bg-black/50 backdrop-blur-xs text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          {item.category.name}
                        </span>
                      )}

                      {item.stock <= 5 && item.stock > 0 && (
                        <span className="absolute top-2 right-2 bg-yellow-500 text-yellow-950 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-yellow-400/30">
                          {item.stock} left
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between gap-2.5">
                      <div>
                        <h4 className="font-bold text-foreground text-xs sm:text-sm group-hover:text-primary transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {item.stock > 0 ? (
                            <span className="text-emerald-600 font-medium">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-destructive font-semibold">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/40 pt-2 gap-1.5">
                        <span className="text-xs sm:text-sm font-extrabold text-foreground font-mono truncate">
                          {formatCurrency(item.price)}
                        </span>

                        {item.stock > 0 ? (
                          hasOptions ? (
                            <button
                              onClick={() => handleCustomizeClick(item)}
                              className="px-2 sm:px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1 text-[11px] sm:text-xs font-bold shrink-0"
                            >
                              <Plus className="h-3 w-3" />
                              <span className="hidden xs:inline">Option</span>
                              {getItemCountInCart(item.id) > 0 && (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                                  {getItemCountInCart(item.id)}
                                </span>
                              )}
                            </button>
                          ) : cartItem ? (
                            <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-lg border border-primary shadow-xs shrink-0">
                              <button
                                onClick={() => updateQty(cartItem.id, -1)}
                                className="hover:scale-110 active:scale-95 transition-transform"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-[11px] font-bold font-mono min-w-[10px] text-center">
                                {cartItem.qty}
                              </span>
                              <button
                                onClick={() => updateQty(cartItem.id, 1)}
                                className="hover:scale-110 active:scale-95 transition-transform"
                                disabled={cartItem.qty >= item.stock}
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-xs shrink-0"
                              aria-label="Add to cart"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded shrink-0">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compact Horizontal List View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredMenuItems.map((item) => {
                const images = getImages(item.image_url);
                const firstImage = images.length > 0 ? images[0] : "";
                const cartItem = cart.find(
                  (c) => c.menuItem.id === item.id && !c.optionId,
                );
                const hasOptions = getOptionsForMenuItem(item).length > 0;

                return (
                  <div
                    key={item.id}
                    className="group bg-card rounded-xl p-3 border border-border/70 shadow-xs hover:shadow-md hover:border-primary/30 transition-all flex gap-3 items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          {item.category?.name && (
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {item.category.name}
                            </span>
                          )}
                          {item.stock <= 5 && item.stock > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/25">
                              Only {item.stock} left
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                          {item.name}
                        </h4>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {item.stock > 0 ? (
                            <span className="text-emerald-600 font-medium">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-destructive font-medium">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-sm font-extrabold text-foreground font-mono">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Thumbnail Image & Action Button */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-muted/40 overflow-hidden shrink-0">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-primary/10 via-secondary/15 to-accent/10 text-primary/40 p-2">
                            <ChefHat className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {item.stock > 0 ? (
                        hasOptions ? (
                          <button
                            onClick={() => handleCustomizeClick(item)}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1 text-xs font-bold"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Option</span>
                            {getItemCountInCart(item.id) > 0 && (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                                {getItemCountInCart(item.id)}
                              </span>
                            )}
                          </button>
                        ) : cartItem ? (
                          <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-2 py-1 rounded-lg border border-primary shadow-xs">
                            <button
                              onClick={() => updateQty(cartItem.id, -1)}
                              className="hover:scale-110 active:scale-95 transition-transform"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
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
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all text-xs font-bold flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </button>
                        )
                      ) : (
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Sold Out
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="bg-card border border-border/60 rounded-3xl p-12 text-center max-w-md mx-auto">
            <ChefHat className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h5 className="font-bold text-foreground text-lg">
              No fruits found
            </h5>
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
          <div className="relative w-full max-w-md bg-background h-full max-h-[100dvh] flex flex-col shadow-2xl border-l border-border z-10 animate-in slide-in-from-right duration-250">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h3 className="font-extrabold text-foreground text-base">
                  Your Cart ({cartCount})
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close cart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {cart.length > 0 ? (
              <form
                onSubmit={handleCheckout}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
                {/* Unified Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 overscroll-contain">
                  {/* Cart Items Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Ordered Items ({cartCount})
                      </span>
                      <button
                        type="button"
                        onClick={() => setCart([])}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Clear Cart
                      </button>
                    </div>

                    <div className="space-y-3">
                      {cart.map((item) => {
                        const images = getImages(item.menuItem.image_url);
                        const firstImage = images.length > 0 ? images[0] : "";

                        return (
                          <div
                            key={item.id}
                            className="flex gap-3 bg-muted/20 border border-border/50 p-3 rounded-xl"
                          >
                            <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                              {firstImage ? (
                                <img
                                  src={firstImage}
                                  alt={item.menuItem.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                  <ChefHat className="h-5 w-5" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-bold text-foreground text-sm truncate">
                                    {item.menuItem.name}
                                  </h5>
                                  {item.optionLabel && (
                                    <span className="text-[10px] font-semibold text-primary block truncate">
                                      {item.optionLabel}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-extrabold text-foreground font-mono shrink-0">
                                  {formatCurrency(
                                    (item.menuItem.price + item.optionPriceAdd) *
                                      item.qty,
                                  )}
                                </span>
                              </div>

                              {/* Quantity controls and item notes */}
                              <div className="flex items-center justify-between mt-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Notes (e.g. less sweet)..."
                                  value={item.notes}
                                  onChange={(e) =>
                                    updateItemNotes(item.id, e.target.value)
                                  }
                                  className="bg-transparent border-b border-border/60 pb-0.5 text-xs text-muted-foreground flex-1 focus:outline-none focus:border-primary focus:ring-0 min-w-0 truncate"
                                />

                                <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-1.5 py-0.5 rounded-lg shrink-0">
                                  <button
                                    type="button"
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
                                    type="button"
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
                      })}
                    </div>
                  </div>

                  {/* Customer Information & Delivery Form */}
                  <div className="pt-3 border-t border-border/70 space-y-3.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Order & Delivery Details
                    </span>

                    {/* Order Type Toggle */}
                    <div className="space-y-1.5">
                      <span className="block text-xs font-semibold text-muted-foreground">
                        Order Option
                      </span>
                      <div
                        className={cn(
                          "grid gap-1 bg-muted/50 p-1 rounded-xl border border-border/40",
                          tableId === "new-order" ? "grid-cols-2" : "grid-cols-3",
                        )}
                      >
                        {tableId !== "new-order" && (
                          <button
                            type="button"
                            onClick={() => setOrderType("dine_in")}
                            className={cn(
                              "py-2 text-xs font-bold rounded-lg transition-all",
                              orderType === "dine_in"
                                ? "bg-background text-foreground shadow-xs animate-fade-in"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            Dine In
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setOrderType("takeaway")}
                          className={cn(
                            "py-2 text-xs font-bold rounded-lg transition-all",
                            orderType === "takeaway"
                              ? "bg-background text-foreground shadow-xs animate-fade-in"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          Takeaway
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType("delivery")}
                          className={cn(
                            "py-2 text-xs font-bold rounded-lg transition-all",
                            orderType === "delivery"
                              ? "bg-background text-foreground shadow-xs animate-fade-in"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          Delivery
                        </button>
                      </div>
                    </div>

                    {/* Order Timing Toggle */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="block text-xs font-semibold text-muted-foreground">
                          Order Time
                        </span>
                        {isScheduled && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                            <Calendar className="h-3 w-3" /> Scheduled
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1 bg-muted/50 p-1 rounded-xl border border-border/40">
                        <button
                          type="button"
                          onClick={() => setIsScheduled(false)}
                          className={cn(
                            "py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                            !isScheduled
                              ? "bg-background text-foreground shadow-xs animate-fade-in"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Order Now</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsScheduled(true)}
                          className={cn(
                            "py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                            isScheduled
                              ? "bg-background text-foreground shadow-xs animate-fade-in"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>Schedule Order</span>
                        </button>
                      </div>

                      {/* Scheduled Date & Time Pickers */}
                      {isScheduled && (
                        <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-3 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              Select Date & Time
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Order for other day
                            </span>
                          </div>

                          {/* Quick Date Shortcuts */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setScheduleDate(getTodayString())}
                              className={cn(
                                "py-1.5 px-2 rounded-lg border text-center text-[11px] font-bold transition-all",
                                scheduleDate === getTodayString()
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                  : "bg-background border-border/60 text-muted-foreground hover:text-foreground",
                              )}
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              onClick={() => setScheduleDate(getTomorrowString())}
                              className={cn(
                                "py-1.5 px-2 rounded-lg border text-center text-[11px] font-bold transition-all",
                                scheduleDate === getTomorrowString()
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                  : "bg-background border-border/60 text-muted-foreground hover:text-foreground",
                              )}
                            >
                              Tomorrow
                            </button>
                            <button
                              type="button"
                              onClick={() => setScheduleDate(getDayAfterTomorrowString())}
                              className={cn(
                                "py-1.5 px-2 rounded-lg border text-center text-[11px] font-bold transition-all",
                                scheduleDate === getDayAfterTomorrowString()
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                  : "bg-background border-border/60 text-muted-foreground hover:text-foreground",
                              )}
                            >
                              In 2 Days
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label
                                htmlFor="schedule-date"
                                className="block text-[10px] font-semibold text-muted-foreground mb-1"
                              >
                                Delivery / Pickup Date
                              </label>
                              <input
                                id="schedule-date"
                                type="date"
                                required={isScheduled}
                                min={getTodayString()}
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="schedule-time"
                                className="block text-[10px] font-semibold text-muted-foreground mb-1"
                              >
                                Target Time
                              </label>
                              <input
                                id="schedule-time"
                                type="time"
                                required={isScheduled}
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            </div>
                          </div>

                          {/* Quick Time Slots */}
                          <div>
                            <span className="block text-[10px] font-semibold text-muted-foreground mb-1">
                              Popular Time Slots
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setScheduleTime(slot)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border transition-colors",
                                    scheduleTime === slot
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-background border-border/60 text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Preview Alert */}
                          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-xs space-y-0.5">
                            <div className="font-bold text-primary flex items-center gap-1.5 text-[11px]">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Scheduled For:
                            </div>
                            <div className="text-foreground font-semibold text-xs">
                              {formatSchedulePreview(scheduleDate, scheduleTime)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="customer-name"
                        className="block text-xs font-semibold text-muted-foreground mb-1.5"
                      >
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
                      <label
                        htmlFor="customer-phone"
                        className="block text-xs font-semibold text-muted-foreground mb-1.5"
                      >
                        Phone Number{" "}
                        {orderType === "delivery" && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <input
                        id="customer-phone"
                        type="tel"
                        required={orderType === "delivery"}
                        placeholder="e.g. 08123456789"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>

                    {orderType === "delivery" && (
                      <div className="space-y-3 p-3 bg-muted/30 border border-border/40 rounded-xl animate-in fade-in-50 duration-200">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label
                              htmlFor="delivery-address"
                              className="block text-xs font-semibold text-muted-foreground"
                            >
                              Delivery Address{" "}
                              <span className="text-destructive">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleUseCurrentLocation}
                              disabled={locatingUser || calculatingDelivery}
                              className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline disabled:opacity-50"
                            >
                              {locatingUser ? (
                                <>
                                  <div className="h-3 w-3 border border-primary border-t-transparent rounded-full animate-spin" />
                                  Locating...
                                </>
                              ) : (
                                <>
                                  <Navigation className="h-3 w-3" />
                                  Use My Location
                                </>
                              )}
                            </button>
                          </div>
                          <textarea
                            id="delivery-address"
                            rows={2}
                            required
                            placeholder="Enter your complete delivery address..."
                            value={deliveryAddress}
                            onChange={(e) => {
                              setDeliveryAddress(e.target.value);
                              if (deliveryDistanceKm !== null || deliveryError) {
                                setDeliveryDistanceKm(null);
                                setDeliveryFee(0);
                                setDeliveryError(null);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs resize-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => checkDeliveryDetails()}
                          disabled={
                            calculatingDelivery || !deliveryAddress.trim()
                          }
                          className="w-full py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {calculatingDelivery ? (
                            <>
                              <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              Checking Distance...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3.5 w-3.5" />
                              Calculate Delivery Fee
                            </>
                          )}
                        </button>

                        {deliveryDistanceKm !== null && !deliveryError && (
                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-xs space-y-1">
                            <div className="font-semibold flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" /> Address verified!
                            </div>
                            <div className="text-[11px] text-emerald-600/90 font-mono">
                              Distance: {deliveryDistanceKm} km • Est:{" "}
                              {deliveryDurationText}
                            </div>
                          </div>
                        )}

                        {deliveryError && (
                          <div className="p-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs space-y-1">
                            <div className="font-semibold flex items-center gap-1">
                              <X className="h-3.5 w-3.5" /> Out of Delivery Range
                            </div>
                            <div className="text-[11px] text-destructive/90 leading-normal">
                              {deliveryError}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="order-notes"
                        className="block text-xs font-semibold text-muted-foreground mb-1.5"
                      >
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

                  {/* Summary Breakdown */}
                  <div className="border-t border-border/80 pt-3 space-y-1.5 pb-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    {orderType === "delivery" && (
                      <div className="flex justify-between text-xs text-muted-foreground animate-in slide-in-from-top-1 duration-150">
                        <span>
                          Delivery Fee{" "}
                          {deliveryDistanceKm !== null &&
                            `(${deliveryDistanceKm} km)`}
                        </span>
                        <span>
                          {deliveryFee > 0
                            ? formatCurrency(deliveryFee)
                            : "Free / Calculating"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Service Fee / Tax</span>
                      <span className="font-mono">Free</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-foreground border-t border-border/50 pt-2">
                      <span>Total Amount</span>
                      <span className="text-primary font-mono">
                        {formatCurrency(
                          cartTotal +
                            (orderType === "delivery" ? deliveryFee : 0),
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Action Bar (Always visible!) */}
                <div className="p-3 sm:p-4 border-t border-border bg-background/95 backdrop-blur-xs shadow-lg shrink-0">
                  <button
                    type="submit"
                    disabled={
                      checkoutLoading ||
                      (orderType === "delivery" &&
                        (deliveryDistanceKm === null ||
                          !!deliveryError ||
                          calculatingDelivery))
                    }
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-99 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {checkoutLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : orderType === "delivery" && calculatingDelivery ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Checking Delivery Distance...</span>
                      </>
                    ) : orderType === "delivery" && !deliveryAddress.trim() ? (
                      <>
                        <MapPin className="h-4 w-4" />
                        <span>Enter Delivery Address</span>
                      </>
                    ) : orderType === "delivery" && deliveryDistanceKm === null ? (
                      <>
                        <MapPin className="h-4 w-4" />
                        <span>Calculate Delivery Fee Above</span>
                      </>
                    ) : isScheduled ? (
                      <>
                        <CalendarDays className="h-4 w-4" />
                        <span>
                          Schedule Order •{" "}
                          {formatCurrency(
                            cartTotal +
                              (orderType === "delivery" ? deliveryFee : 0),
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>
                          Place Order •{" "}
                          {formatCurrency(
                            cartTotal +
                              (orderType === "delivery" ? deliveryFee : 0),
                          )}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-12 p-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h4 className="font-bold text-foreground">
                  Your cart is empty
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Go back to the menu to add fresh organic fruits.
                </p>
              </div>
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
            <span className="text-sm font-extrabold font-mono">
              {formatCurrency(cartTotal)}
            </span>
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
                  <div className="font-bold text-foreground">
                    {customizingItem.name}
                  </div>
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
                            : "border-border/60 bg-card hover:bg-muted/30",
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
                                : "border-muted-foreground/30",
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
                      onClick={() =>
                        setCustomizingQty((q) => Math.max(1, q - 1))
                      }
                      className="hover:scale-110 active:scale-95 text-foreground hover:bg-transparent"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-bold font-mono min-w-[15px] text-center">
                      {customizingQty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomizingQty((q) =>
                          Math.min(customizingItem.stock, q + 1),
                        )
                      }
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
                  const selectedOpt = options.find(
                    (o) => o.id === selectedOptionId,
                  );
                  if (!selectedOpt) return;

                  // Add customizingQty times to cart
                  const cartItemId = `${customizingItem.id}_${selectedOptionId}`;
                  setCart((prev) => {
                    const existing = prev.find(
                      (item) => item.id === cartItemId,
                    );
                    if (existing) {
                      return prev.map((item) =>
                        item.id === cartItemId
                          ? {
                              ...item,
                              qty: item.qty + customizingQty,
                              notes: customizingNotes || item.notes,
                            }
                          : item,
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
                    `${customizingItem.name} (${selectedOpt.variantName}: ${selectedOpt.label}) added to cart!`,
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
                      (getOptionsForMenuItem(customizingItem).find(
                        (o) => o.id === selectedOptionId,
                      )?.price_add || 0)) *
                      customizingQty,
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
