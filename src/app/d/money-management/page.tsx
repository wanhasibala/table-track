"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useGetResourceQuery } from "@/store/services/flexible-querry";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import { expenseColumns, summaryColumns } from "./money";
import { MoneyForm } from "./money-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Calendar,
  Layers,
  FileText,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

export default function MoneyManagementPage() {
  const expCols = expenseColumns();
  const sumCols = summaryColumns();

  const [dialog, setDialog] = useState({
    open: false,
    id: "",
  });

  // Date Filter State: "today" | "week" | "month" | "year" | "custom" | "all"
  const [dateFilter, setDateFilter] = useState<string>("month");

  // Custom date bounds (YYYY-MM-DD strings)
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]; // start of month
  });
  
  const [customTo, setCustomTo] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]; // today
  });

  // Toggle between "summary" (grouped view) and "expenses" (raw ledger view)
  const [viewMode, setViewMode] = useState<"summary" | "expenses">("summary");

  // Compute date boundary parameters for query filtering
  const filterDateBoundaries = useMemo(() => {
    if (dateFilter === "all") return null;

    let startDate = new Date();
    let endDate = new Date();

    if (dateFilter === "today") {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { gte: startDate.toISOString(), lte: endDate.toISOString() };
    } 
    
    if (dateFilter === "week") {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), diff);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { gte: startDate.toISOString(), lte: endDate.toISOString() };
    } 
    
    if (dateFilter === "month") {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { gte: startDate.toISOString(), lte: endDate.toISOString() };
    } 
    
    if (dateFilter === "year") {
      startDate = new Date(startDate.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { gte: startDate.toISOString(), lte: endDate.toISOString() };
    }

    if (dateFilter === "custom") {
      startDate = new Date(customFrom + "T00:00:00");
      endDate = new Date(customTo + "T23:59:59");
      return { gte: startDate.toISOString(), lte: endDate.toISOString() };
    }

    return null;
  }, [dateFilter, customFrom, customTo]);

  // Query parameters for expenses
  const queryParamsExpenses = useMemo(() => {
    return {
      order: "desc" as const,
      sort: "date" as const,
      ...(filterDateBoundaries?.gte ? { date_gte: filterDateBoundaries.gte } : {}),
      ...(filterDateBoundaries?.lte ? { date_lte: filterDateBoundaries.lte } : {}),
    };
  }, [filterDateBoundaries]);

  // Query parameters for orders
  const queryParamsOrders = useMemo(() => {
    return {
      order: "desc" as const,
      sort: "created_at" as const,
      ...(filterDateBoundaries?.gte ? { created_at_gte: filterDateBoundaries.gte } : {}),
      ...(filterDateBoundaries?.lte ? { created_at_lte: filterDateBoundaries.lte } : {}),
    };
  }, [filterDateBoundaries]);

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

  // Grouped transaction data by timeframe period
  const groupedSummaryData = useMemo(() => {
    const groups: Record<string, { label: string; income: number; expenses: number }> = {};

    const getGroupKeyAndLabel = (dateObj: Date): { key: string; label: string } => {
      if (dateFilter === "today") {
        const timeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        return { key: timeStr, label: timeStr };
      }
      if (dateFilter === "week" || dateFilter === "custom") {
        const dayName = dateObj.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" });
        const key = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
        return { key, label: dayName };
      }
      if (dateFilter === "month") {
        const dateStr = dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
        const key = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
        return { key, label: dateStr };
      }
      if (dateFilter === "year") {
        const monthName = dateObj.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
        return { key, label: monthName };
      }
      // "all"
      const yearStr = dateObj.getFullYear().toString();
      return { key: yearStr, label: yearStr };
    };

    // 1. Process sales income
    orders.forEach((order: any) => {
      const isCompleted = order.status === "completed" || order.status === "served";
      if (!isCompleted) return;

      const orderDate = new Date(order.created_at);
      const { key, label } = getGroupKeyAndLabel(orderDate);

      if (!groups[key]) {
        groups[key] = { label, income: 0, expenses: 0 };
      }
      groups[key].income += Number(order.total_amount || 0);
    });

    // 2. Process expenses
    expenses.forEach((exp: any) => {
      const expDate = new Date(exp.date);
      const { key, label } = getGroupKeyAndLabel(expDate);

      if (!groups[key]) {
        groups[key] = { label, income: 0, expenses: 0 };
      }
      groups[key].expenses += Number(exp.amount || 0);
    });

    // Convert groups record to an array and sort
    const list = Object.entries(groups).map(([key, data]) => ({
      id: key,
      label: data.label,
      income: data.income,
      expenses: data.expenses,
      profit: data.income - data.expenses,
    }));

    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [orders, expenses, dateFilter]);

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
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Money Management</h3>
          <p className="text-sm text-muted-foreground">Manage your operations expenses and review total revenue calculated from sales orders.</p>
        </div>
        
        {/* Date Filter & Export Options Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Date Picker Range (Shown only when dateFilter is "custom") */}
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 bg-card border border-border/80 rounded-lg p-1.5 shadow-sm">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 text-xs w-32 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
              />
              <ArrowRight className="size-3 text-muted-foreground" />
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 text-xs w-32 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
              />
            </div>
          )}

          {/* Timeframe selector */}
          <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-lg px-2 py-1 shadow-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <Select value={dateFilter} onValueChange={(val) => {
              setDateFilter(val);
              if (val !== "today" && val !== "all") {
                setViewMode("summary");
              }
            }}>
              <SelectTrigger className="border-0 shadow-none focus:ring-0 h-8 text-xs font-semibold w-28 bg-transparent">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Daily (Today)</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
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

      {/* Main Datatable display */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-2">
          {/* Toggles */}
          <div className="flex items-center gap-1.5">
            <Button
              variant={viewMode === "summary" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("summary")}
              className="text-xs font-semibold flex items-center gap-1.5 h-8.5"
            >
              <Layers className="size-3.5" /> Financial Summary
            </Button>
            <Button
              variant={viewMode === "expenses" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("expenses")}
              className="text-xs font-semibold flex items-center gap-1.5 h-8.5"
            >
              <FileText className="size-3.5" /> Expenses Ledger
            </Button>
          </div>

          <Button
            size="sm"
            onClick={() => setDialog({ open: true, id: "new" })}
            className="text-xs font-bold h-8.5"
          >
            Record Expense
          </Button>
        </div>

        {viewMode === "summary" ? (
          <div>
            <h4 className="text-sm font-bold mb-3 text-muted-foreground">Grouped Profit Summary ({groupedSummaryData.length})</h4>
            <AdvancedTable
              columns={sumCols}
              data={groupedSummaryData}
            />
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-bold mb-3 text-muted-foreground">Expenses Ledger ({expenses.length})</h4>
            <AdvancedTable
              columns={expCols}
              data={expenses}
              row_click={(id) => setDialog({ open: true, id: id || "" })}
            />
          </div>
        )}
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
