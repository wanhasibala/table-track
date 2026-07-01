"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useGetResourceQuery } from "@/store/services/flexible-querry";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import { expenseColumns } from "./money";
import { MoneyForm } from "./money-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Download,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

export default function MoneyManagementPage() {
  const columns = expenseColumns();

  const [dialog, setDialog] = useState({
    open: false,
    id: "",
  });

  // Date Filter State: "today" | "week" | "month" | "year" | "all"
  const [dateFilter, setDateFilter] = useState<string>("month");

  // Compute date boundary parameter for query filtering
  const filterDateLimit = useMemo(() => {
    if (dateFilter === "all") return null;

    const now = new Date();
    let startDate = new Date();

    if (dateFilter === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateFilter === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
    } else if (dateFilter === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateFilter === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    startDate.setHours(0, 0, 0, 0);
    return startDate.toISOString();
  }, [dateFilter]);

  // Query parameters for expenses
  const queryParamsExpenses = useMemo(() => {
    return {
      order: "desc" as const,
      sort: "date" as const,
      ...(filterDateLimit ? { date_gte: filterDateLimit } : {}),
    };
  }, [filterDateLimit]);

  // Query parameters for orders
  const queryParamsOrders = useMemo(() => {
    return {
      order: "desc" as const,
      sort: "created_at" as const,
      ...(filterDateLimit ? { created_at_gte: filterDateLimit } : {}),
    };
  }, [filterDateLimit]);

  // 1. Fetch live operational expenses with DB-side filtering
  const { data: expenseData, isLoading: expensesLoading, refetch: refetchExpenses } = useGetResourceQuery({
    resource: "expense",
    params: queryParamsExpenses,
  });

  // 2. Fetch live sales from order_table with DB-side filtering
  const { data: orderData, isLoading: ordersLoading, refetch: refetchOrders } = useGetResourceQuery({
    resource: "order_table",
    params: queryParamsOrders,
  });

  // Setup Supabase Real-Time listener
  useEffect(() => {
    const supabase = createClient();
    
    const expenseChannel = supabase
      .channel("expenses-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense" },
        () => refetchExpenses()
      )
      .subscribe();

    const orderChannel = supabase
      .channel("order-sales-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_table" },
        () => refetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expenseChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [refetchExpenses, refetchOrders]);

  const expenses = expenseData?.data || [];
  const orders = orderData?.data || [];

  // Compute metrics from DB-filtered values
  const metrics = useMemo(() => {
    // Only count completed and served orders as successful sales income
    const salesIncome = orders.reduce((sum: number, order: any) => {
      const isCompleted = order.status === "completed" || order.status === "served";
      return isCompleted ? sum + Number(order.total_amount || 0) : sum;
    }, 0);

    const totalExpenses = expenses.reduce((sum: number, exp: any) => {
      return sum + Number(exp.amount || 0);
    }, 0);

    return {
      income: salesIncome,
      expenses: totalExpenses,
      balance: salesIncome - totalExpenses,
    };
  }, [orders, expenses]);

  // Export to Excel (CSV)
  const handleExportCSV = () => {
    if (expenses.length === 0 && orders.length === 0) {
      toast.error("No transaction data available to export");
      return;
    }

    const csvRows = [];
    csvRows.push(["Date", "Type", "Category", "Description", "Amount (IDR)"].join(","));

    // 1. Add Sales Income rows
    orders.forEach((order: any) => {
      const isCompleted = order.status === "completed" || order.status === "served";
      if (!isCompleted) return;
      
      const row = [
        new Date(order.created_at).toLocaleDateString("id-ID"),
        "Income (Sale)",
        "Order Sale",
        `Order ID: #${order.id.slice(0, 8)} (${order.customer_name || "Guest"}) - Status: ${order.status}`,
        order.total_amount
      ];
      csvRows.push(row.map(val => `"${val}"`).join(","));
    });

    // 2. Add Expense rows
    expenses.forEach((exp: any) => {
      const row = [
        new Date(exp.date).toLocaleDateString("id-ID"),
        "Expense",
        exp.category.replace("_", " "),
        exp.description || "",
        `-${exp.amount}`
      ];
      csvRows.push(row.map(val => `"${val}"`).join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${dateFilter}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel report exported successfully");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (expensesLoading || ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="size-8 text-primary animate-spin" />
        <span className="text-muted-foreground text-sm">Aggregating financials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Money Management</h3>
          <p className="text-sm text-muted-foreground">Manage your operations expenses and review total revenue calculated from sales orders.</p>
        </div>
        
        {/* Date Filter & Export Options Toolbar */}
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-lg px-2 py-1">
            <Calendar className="size-4 text-muted-foreground" />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="border-0 shadow-none focus:ring-0 h-8 text-xs font-semibold w-28 bg-transparent">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Daily (Today)</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="size-3.5" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Total Sales (Income) */}
        <Card className="border-emerald-500/10 bg-emerald-500/5 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Total Sales (Income)</CardTitle>
            <div className="p-1 bg-emerald-500/10 rounded">
              <ArrowUpRight className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(metrics.income)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="size-3 text-emerald-500" /> Dynamic sales timeframe data
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-rose-500/10 bg-rose-500/5 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-rose-700 dark:text-rose-400">Total Expenses</CardTitle>
            <div className="p-1 bg-rose-500/10 rounded">
              <ArrowDownLeft className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(metrics.expenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingDown className="size-3 text-rose-500" /> Operational cost metrics
            </p>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card className="border-primary/10 bg-primary/5 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-primary">Net Profit / Balance</CardTitle>
            <div className="p-1 bg-primary/10 rounded">
              <Wallet className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black font-mono ${metrics.balance >= 0 ? "text-primary" : "text-rose-500"}`}>
              {formatCurrency(metrics.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sales income minus total expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Table view for Expenses */}
      <div>
        <h4 className="text-md font-bold mb-3 text-muted-foreground">Expenses Ledger ({expenses.length})</h4>
        <AdvancedTable
          columns={columns}
          data={expenses}
          addButton={{
            text: "Record Expense",
            onClick: () => setDialog({ open: true, id: "new" }),
          }}
          row_click={(id) => setDialog({ open: true, id: id || "" })}
        />
      </div>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md w-full">
          <DialogTitle className="mb-2">
            {dialog.id === "new" ? "Record Expense" : "Expense Details"}
          </DialogTitle>
          <MoneyForm
            id={dialog.id}
            onSuccess={() => {
              setDialog({ open: false, id: "" });
              refetchExpenses();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
