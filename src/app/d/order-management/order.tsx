/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ColumnDef } from "@tanstack/react-table";

export const orderColumns = (
  formatCurrency: (val: number) => string
): ColumnDef<any>[] => [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        #{row.original.id.slice(0, 8)}...
      </span>
    ),
  },
  {
    accessorKey: "customer_name",
    header: "Customer Info",
    cell: ({ row }) => {
      const name = row.original.customer_name || "Guest";
      const phone = row.original.customer_phone;
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{name}</span>
          {phone && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {phone}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const colors: Record<string, string> = {
        pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/25 dark:text-yellow-400 dark:bg-yellow-500/20",
        confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400 dark:bg-blue-500/20",
        preparing: "bg-purple-500/10 text-purple-600 border-purple-500/25 dark:text-purple-400 dark:bg-purple-500/20",
        served: "bg-indigo-500/10 text-indigo-600 border-indigo-500/25 dark:text-indigo-400 dark:bg-indigo-500/20",
        completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400 dark:bg-emerald-500/20",
        cancelled: "bg-destructive/10 text-destructive border-destructive/25 dark:text-red-400 dark:bg-destructive/20",
      };
      return (
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border shadow-sm capitalize ${colors[status] || ""}`}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount",
    cell: ({ row }) => formatCurrency(row.original.total_amount),
  },
  {
    accessorKey: "handled_by",
    header: "Handled By",
    cell: ({ row }) => row.original.user_account?.name || "N/A",
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => {
      const d = new Date(row.original.created_at);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
];
