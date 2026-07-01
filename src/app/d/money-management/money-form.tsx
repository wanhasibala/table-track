"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const MoneyForm = ({
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

  // Fields
  const [amount, setAmount] = useState<number | "">("");
  const [category, setCategory] = useState("ingredients");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("user_account")
          .select("tenant_id")
          .eq("id", user.id)
          .single();

        if (profile?.tenant_id) {
          setTenantId(profile.tenant_id);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    };
    loadProfile();
  }, []);

  // Load expense data if editing
  useEffect(() => {
    const loadExpense = async () => {
      if (isNew || !id) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("expense")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (data) {
          setAmount(data.amount);
          setCategory(data.category);
          setDescription(data.description || "");
          setDate(new Date(data.date).toISOString().split("T")[0]);
        }
      } catch (err: any) {
        console.error("Error loading expense:", err);
        toast.error("Failed to load expense details");
      } finally {
        setLoading(false);
      }
    };
    loadExpense();
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!tenantId) {
      toast.error("User profile is missing tenant configuration");
      return;
    }

    setSubmitLoading(true);
    try {
      const supabase = createClient();
      const body = {
        tenant_id: tenantId,
        amount: Number(amount),
        category,
        description: description || null,
        date: new Date(date).toISOString(),
      };

      if (isNew) {
        const { error } = await supabase.from("expense").insert(body);
        if (error) throw error;
        toast.success("Expense recorded successfully");
      } else {
        const { error } = await supabase
          .from("expense")
          .update(body)
          .eq("id", id);
        if (error) throw error;
        toast.success("Expense updated successfully");
      }

      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save expense");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    setDeleteLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("expense")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Expense deleted successfully");
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete expense");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm font-medium">
        Loading expense details...
      </div>
    );
  }

  const categoryOptions = [
    { value: "ingredients", label: "Ingredients & Inventory" },
    { value: "salary", label: "Staff Salary" },
    { value: "rent", label: "Rent & Space" },
    { value: "utilities", label: "Utilities (Water, Electricity)" },
    { value: "marketing", label: "Marketing & Ads" },
    { value: "other_expense", label: "Other Expense" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount Input */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Amount (IDR)</label>
        <Input
          type="number"
          placeholder="e.g. 50000"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || "")}
          className="w-full bg-background"
        />
      </div>

      {/* Category Dropdown */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Selector */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Date</label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-background"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Description (Optional)</label>
        <Textarea
          placeholder="Enter description/notes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-background"
          rows={3}
        />
      </div>

      {/* Footer Buttons */}
      <div className="pt-4 flex justify-between gap-3 border-t border-border/80">
        {!isNew && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteLoading || submitLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            type="submit"
            disabled={submitLoading || deleteLoading}
            className="px-6 font-bold"
          >
            {submitLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
};
