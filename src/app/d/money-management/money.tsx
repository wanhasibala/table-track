"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CalendarClock } from "lucide-react";
import { parseOrderSchedule, getOrderEffectiveDate } from "@/utils/order-schedule";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const expenseColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const d = new Date(row.original.date);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
  },
  {
    accessorKey: "category",
    header: "Expense Category",
    cell: ({ row }) => {
      const colors: Record<string, string> = {
        ingredients: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
        salary: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
        rent: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
        utilities: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
        marketing: "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400",
        other_expense: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
      };
      const cat = row.original.category;
      const label = cat.replace("_", " ");
      return (
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border capitalize ${colors[cat] || ""}`}>
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description / Notes",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs font-medium">
        {row.original.description || "—"}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount Paid",
    cell: ({ row }) => (
      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
        - {formatCurrency(row.original.amount)}
      </span>
    ),
  },
];

export const summaryColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "label",
    header: "Period",
    cell: ({ row }) => <span className="font-semibold">{row.original.label}</span>,
  },
  {
    accessorKey: "income",
    header: "Total Income",
    cell: ({ row }) => (
      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
        {formatCurrency(row.original.income)}
      </span>
    ),
  },
  {
    accessorKey: "expenses",
    header: "Total Expenses",
    cell: ({ row }) => (
      <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
        {formatCurrency(row.original.expenses)}
      </span>
    ),
  },
  {
    accessorKey: "profit",
    header: "Net Profit",
    cell: ({ row }) => {
      const isPositive = row.original.profit >= 0;
      return (
        <span className={`font-mono font-black ${isPositive ? "text-primary" : "text-rose-500"}`}>
          {formatCurrency(row.original.profit)}
        </span>
      );
    },
  },
];

export const salesColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "order_number",
    header: "Order ID",
    cell: ({ row }) => {
      const schedule = parseOrderSchedule(row.original);
      return (
        <div className="flex flex-col gap-1">
          <span className="font-mono font-bold text-xs text-primary">
            #TT-{row.original.order_number || row.original.id?.slice(0, 8)}
          </span>
          {schedule.isScheduled && (
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-tight bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 w-fit">
              <CalendarClock className="h-2.5 w-2.5" />
              <span>Schedule</span>
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Effective Date",
    cell: ({ row }) => {
      const schedule = parseOrderSchedule(row.original);
      const effectiveDate = getOrderEffectiveDate(row.original);
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-xs text-foreground">
            {effectiveDate.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {schedule.isScheduled ? (
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              Schedule: {schedule.formattedSchedule}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground font-mono">
              Placed: {new Date(row.original.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-xs text-foreground">
          {row.original.customer_name || "Guest Diner"}
        </span>
        <span className="text-[10px] text-muted-foreground capitalize">
          {row.original.type ? row.original.type.replace("_", " ") : "Dine In"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Order & Payment Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const paymentStatus = row.original.payment_status;
      const isPaid = paymentStatus === "paid" || paymentStatus === "settlement" || status === "completed" || status === "served";
      return (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold capitalize text-foreground">
            {status}
          </span>
          <span className={`text-[10px] font-mono font-bold uppercase ${isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
            {isPaid ? "Paid ✓" : "Unpaid"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "total_amount",
    header: "Order Revenue",
    cell: ({ row }) => (
      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
        + {formatCurrency(Number(row.original.total_amount || 0))}
      </span>
    ),
  },
];
