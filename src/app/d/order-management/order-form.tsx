/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AsyncCombobox } from "@/components/ui/async-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const OrderForm = ({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess?: () => void;
}) => {
  const isNew = id === "new";
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [tenantId, setTenantId] = useState("");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [menuMap, setMenuMap] = useState<Record<string, any>>({});

  // Form Fields State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [status, setStatus] = useState("pending");
  const [handledBy, setHandledBy] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([]);

  // 1. Load Metadata (Tenant, Menu Items with nested variants & options)
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: profile } = await supabase
          .from("user_account")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        if (!profile?.tenant_id) return;
        setTenantId(profile.tenant_id);

        const { data: menuData } = await supabase
          .from("menu_item")
          .select(`
            id, name, price, is_available,
            menu_variant (
              id, name, is_required,
              menu_variant_option (
                id, label, price_add
              )
            )
          `)
          .eq("tenant_id", profile.tenant_id);
          
        setMenuItems(menuData || []);
        
        const map: Record<string, any> = {};
        menuData?.forEach((item: any) => {
          map[item.id] = {
            name: item.name,
            price: item.price,
            variants: item.menu_variant || []
          };
        });
        setMenuMap(map);
      } catch (e) {
        console.error("Error loading metadata:", e);
      }
    };
    loadMetadata();
  }, []);

  // 2. Load Order Details & Items (if editing)
  useEffect(() => {
    const loadOrderData = async () => {
      if (isNew) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data: orderData, error: orderError } = await supabase
          .from("order_table")
          .select("*")
          .eq("id", id)
          .single();
        if (orderError) throw orderError;
        
        setCustomerName(orderData.customer_name || "");
        setCustomerPhone(orderData.customer_phone || "");
        setStatus(orderData.status);
        setHandledBy(orderData.handled_by || "");
        setNotes(orderData.notes || "");
        
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_item")
          .select("*")
          .eq("order_id", id);
        if (itemsError) throw itemsError;
        
        setItems(itemsData.map((item: any) => ({
          tempId: Math.random().toString(36).substring(7),
          menu_item_id: item.menu_item_id || "",
          option_id: item.option_id || "",
          qty: item.qty || 1,
          unit_price: item.unit_price || 0,
          notes: item.notes || ""
        })));
      } catch (err: any) {
        console.error("Error loading order:", err);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    loadOrderData();
  }, [id, isNew]);

  // Calculations
  const grandTotal = items.reduce((sum, item) => {
    return sum + (Number(item.qty || 0) * Number(item.unit_price || 0));
  }, 0);

  // Field Options Fetchers
  const loadTables = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("table_spot")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);
    return (data || []).map((t) => ({ value: t.id, label: t.name }));
  };

  const loadStaff = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("user_account")
      .select("id, name, email")
      .eq("tenant_id", tenantId);
    return (data || []).map((u) => ({ value: u.id, label: u.name || u.email }));
  };

  const loadMenuOptions = async () => {
    return menuItems
      .filter((m) => m.is_available)
      .map((m) => ({ value: m.id, label: m.name }));
  };

  // Item Event Handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: Math.random().toString(36).substring(7),
        menu_item_id: "",
        option_id: "",
        qty: 1,
        unit_price: 0,
        notes: ""
      }
    ]);
  };

  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleItemChange = (tempId: string, updates: Partial<any>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;

        const updated = { ...item, ...updates };

        // If menu item changes, auto-fill base price and clear options
        if ("menu_item_id" in updates) {
          const details = menuMap[updates.menu_item_id || ""];
          updated.unit_price = details ? details.price : 0;
          updated.option_id = "";
        }

        // If option changes, calculate price including price_add
        if ("option_id" in updates) {
          const details = menuMap[updated.menu_item_id];
          if (details) {
            let basePrice = details.price;
            if (updates.option_id) {
              const options = getOptionsForMenuItem(updated.menu_item_id);
              const selectedOpt = options.find((o) => o.id === updates.option_id);
              if (selectedOpt) {
                basePrice += selectedOpt.price_add;
              }
            }
            updated.unit_price = basePrice;
          }
        }

        return updated;
      })
    );
  };

  const getOptionsForMenuItem = (menuItemId: string) => {
    const details = menuMap[menuItemId];
    if (!details) return [];
    
    const options: any[] = [];
    details.variants?.forEach((variant: any) => {
      variant.menu_variant_option?.forEach((opt: any) => {
        options.push({
          id: opt.id,
          label: `${variant.name}: ${opt.label} (+${formatCurrency(opt.price_add)})`,
          price_add: opt.price_add
        });
      });
    });
    return options;
  };

  // Submit Operations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Please add at least one item to the order.");
      return;
    }

    setSubmitLoading(true);
    try {
      const supabase = createClient();
      const orderBody = {
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        status: status as any,
        handled_by: handledBy || null,
        notes: notes || null,
        total_amount: grandTotal,
        tenant_id: tenantId,
      };

      let orderId = id;
      if (isNew) {
        const { data: newOrder, error } = await supabase
          .from("order_table")
          .insert(orderBody)
          .select()
          .single();
        if (error) throw error;
        orderId = newOrder.id;
      } else {
        const { error } = await supabase
          .from("order_table")
          .update(orderBody)
          .eq("id", id);
        if (error) throw error;
      }

      // Delete existing order items
      if (!isNew) {
        const { error } = await supabase
          .from("order_item")
          .delete()
          .eq("order_id", orderId);
        if (error) throw error;
      }

      // Insert new order items
      const itemsToInsert = items.map((item) => ({
        order_id: orderId,
        menu_item_id: item.menu_item_id || null,
        option_id: item.option_id || null,
        qty: Number(item.qty) || 1,
        unit_price: Number(item.unit_price) || 0,
        notes: item.notes || null,
        tenant_id: tenantId
      }));

      const { error: insertError } = await supabase
        .from("order_item")
        .insert(itemsToInsert);
      if (insertError) throw insertError;

      // Automatically mark associated payments as paid if order is confirmed or completed
      if (status === "confirmed" || status === "completed") {
        await supabase
          .from("payment")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("order_id", orderId);
      }

      toast.success(isNew ? "Order created successfully" : "Order updated successfully");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save order");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    setDeleteLoading(true);
    try {
      const supabase = createClient();
      
      // Delete child rows first
      const { error: deleteItemsError } = await supabase
        .from("order_item")
        .delete()
        .eq("order_id", id);
      if (deleteItemsError) throw deleteItemsError;

      // Delete master row
      const { error: deleteOrderError } = await supabase
        .from("order_table")
        .delete()
        .eq("id", id);
      if (deleteOrderError) throw deleteOrderError;

      toast.success("Order deleted successfully");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete order");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm font-medium">Loading details...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Order Meta Info */}
        <div className="md:col-span-5 space-y-4">
          <Card className="p-4 border border-border/80 bg-card/50 backdrop-blur-xs space-y-4">
            <h4 className="text-sm font-bold text-foreground/80 tracking-wide uppercase">Order Metadata</h4>
            
            {/* Customer Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Customer Name</label>
              <Input
                type="text"
                placeholder="e.g. John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-background text-sm"
              />
            </div>

            {/* Customer Phone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Customer Phone</label>
              <Input
                type="text"
                placeholder="e.g. +62812345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-background text-sm"
              />
            </div>

            {/* Handled By */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Handled By (Staff)</label>
              <AsyncCombobox
                loadOptions={loadStaff}
                value={handledBy}
                onChange={(val) => setHandledBy(val as string)}
                placeholder="Select Handled Staff"
                className="w-full"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Order Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="General notes about the order..."
                className="w-full bg-background"
                rows={3}
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Order Items Stack */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-foreground/80 tracking-wide uppercase flex items-center gap-1.5">
              <ShoppingBag className="h-4.5 w-4.5 text-primary" />
              Order Lines ({items.length})
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="h-8 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
          </div>

          <ScrollArea className="max-h-[420px] pr-2 border rounded-xl bg-muted/10">
            <div className="p-3 space-y-3">
              {items.length > 0 ? (
                items.map((item, index) => {
                  const options = getOptionsForMenuItem(item.menu_item_id);

                  return (
                    <Card key={item.tempId} className="p-4 border border-border bg-background relative space-y-3.5 shadow-xs">
                      {/* Card Header */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground font-mono">
                          ITEM #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.tempId)}
                          className="p-1 rounded text-destructive hover:bg-destructive/10 hover:scale-105 active:scale-95 transition-all"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Main Fields Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Menu Item dropdown */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Fruit / Item</label>
                          <AsyncCombobox
                            loadOptions={loadMenuOptions}
                            value={item.menu_item_id}
                            onChange={(val) => handleItemChange(item.tempId, { menu_item_id: val })}
                            placeholder="Select Fruit"
                            className="w-full"
                          />
                        </div>

                        {/* Variant/Option selector */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Option / Size</label>
                          <Select
                            disabled={!item.menu_item_id || options.length === 0}
                            value={item.option_id || "_none"}
                            onValueChange={(val) => handleItemChange(item.tempId, { option_id: val === "_none" ? "" : val })}
                          >
                            <SelectTrigger className="w-full bg-background text-xs">
                              <SelectValue placeholder={options.length > 0 ? "Choose Option" : "No Options"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">Standard (Base)</SelectItem>
                              {options.map((opt) => (
                                <SelectItem key={opt.id} value={opt.id} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Pricing Grid */}
                      <div className="grid grid-cols-3 gap-3 border-t border-border/40 pt-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Qty</label>
                          <Input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => handleItemChange(item.tempId, { qty: Number(e.target.value) || 1 })}
                            className="h-8.5 text-xs bg-background"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Unit Price</label>
                          <Input
                            type="text"
                            disabled
                            value={formatCurrency(item.unit_price)}
                            className="h-8.5 text-xs bg-muted/30 cursor-not-allowed font-mono text-foreground font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Subtotal</label>
                          <span className="h-8.5 border border-transparent flex items-center text-xs font-mono font-extrabold text-foreground">
                            {formatCurrency(item.qty * item.unit_price)}
                          </span>
                        </div>
                      </div>

                      {/* Notes Input */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Line Notes</label>
                        <Input
                          type="text"
                          placeholder="e.g. less sweet, ripe fruit..."
                          value={item.notes}
                          onChange={(e) => handleItemChange(item.tempId, { notes: e.target.value })}
                          className="h-8.5 text-xs bg-background"
                        />
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted-foreground/50 text-xs font-medium">
                  No items added yet. Click "Add Item" to start.
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Grand Total Billing Card */}
          <Card className="p-4 border border-primary/20 bg-primary/5 rounded-2xl flex justify-between items-center">
            <span className="text-sm font-bold text-foreground">Grand Total:</span>
            <span className="text-lg font-black text-primary font-mono">{formatCurrency(grandTotal)}</span>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-border/80 pt-4 flex justify-between gap-3">
        {!isNew && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteLoading || submitLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete Order"}
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            type="submit"
            disabled={submitLoading || deleteLoading}
            className="px-6 font-bold"
          >
            {submitLoading ? "Saving..." : "Save Order"}
          </Button>
        </div>
      </div>
    </form>
  );
};
