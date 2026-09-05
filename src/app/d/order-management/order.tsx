/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Calendar, CalendarClock } from "lucide-react";
import { parseOrderSchedule } from "@/utils/order-schedule";

export const orderColumns = (
  formatCurrency: (val: number) => string,
): ColumnDef<any>[] => [
  {
    accessorKey: "id",
    size: 80,
    header: "Order ID",
    cell: ({ row }) => {
      const schedule = parseOrderSchedule(row.original);
      return (
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground font-semibold">
            #{row.original.order_number}
          </span>
          {schedule.isScheduled && (
            <span
              title={`Scheduled for ${schedule.formattedSchedule}`}
              className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-tight bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 w-fit"
            >
              <CalendarClock className="h-2.5 w-2.5" />
              <span>Schedule</span>
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "customer_name",
    header: "Customer Info",
    cell: ({ row }) => {
      const name = row.original.customer_name || "Guest";
      const phone = row.original.customer_phone;
      const type = row.original.type;

      return (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{name}</span>
          {phone && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {phone}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/80 capitalize">
            {type ? type.replace("_", " ") : "Dine In"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "order_item",
    header: "Order Items",
    size: 260,
    minSize: 200,
    cell: ({ row }) => {
      const items = row.original.order_item;

      if (!Array.isArray(items) || items.length === 0) {
        return (
          <span className="text-xs text-muted-foreground italic">No items</span>
        );
      }

      return (
        <div className="flex flex-col gap-1.5 py-0.5">
          {items.map((oi: any, idx: number) => {
            const qty = oi?.qty || 1;
            const name = oi?.menu_item?.name || "Unnamed Item";
            const notes = oi?.notes;

            return (
              <div
                key={oi.id || idx}
                className="flex items-start gap-1.5 text-xs leading-snug"
              >
                <span className="inline-flex items-center justify-center font-mono font-bold text-[10px] bg-muted/80 text-foreground px-1.5 py-0.5 rounded border border-border/60 shrink-0">
                  {qty}x
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate">
                    {name}
                  </span>
                  {notes && (
                    <span className="text-[10px] text-muted-foreground italic">
                      Note: {notes}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
        pending:
          "bg-yellow-500/10 text-yellow-600 border-yellow-500/25 dark:text-yellow-400 dark:bg-yellow-500/20",
        confirmed:
          "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400 dark:bg-blue-500/20",
        preparing:
          "bg-purple-500/10 text-purple-600 border-purple-500/25 dark:text-purple-400 dark:bg-purple-500/20",
        served:
          "bg-indigo-500/10 text-indigo-600 border-indigo-500/25 dark:text-indigo-400 dark:bg-indigo-500/20",
        completed:
          "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400 dark:bg-emerald-500/20",
        cancelled:
          "bg-destructive/10 text-destructive border-destructive/25 dark:text-red-400 dark:bg-destructive/20",
      };
      return (
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border shadow-sm capitalize ${colors[status] || ""}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount",
    cell: ({ row }) => (
      <div className="text-right">
        {formatCurrency(row.original.total_amount)}
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Date & Schedule",
    size: 170,
    cell: ({ row }) => {
      const schedule = parseOrderSchedule(row.original);
      const d = new Date(row.original.created_at);
      const createdStr = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      return (
        <div className="flex flex-col gap-1 py-0.5">
          {schedule.isScheduled ? (
            <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30 shadow-2xs w-fit">
              <Calendar className="h-3 w-3 shrink-0 text-purple-600 dark:text-purple-400" />
              <span>{schedule.formattedSchedule}</span>
            </span>
          ) : null}
          <span className="text-[11px] text-muted-foreground">
            Placed: {createdStr}
          </span>
        </div>
      );
    },
  },
];
