"use client";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import { orderColumns } from "./order";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { OrderForm } from "./order-form";
import { useGetResourceQuery } from "@/store/services/flexible-querry";
import { createClient } from "@/utils/supabase/client";
import { parseOrderSchedule, isOrderEffectiveToday, getOrderEffectiveDate } from "@/utils/order-schedule";
import { type FilterConfig } from "@/components/ui/data-table/filter";
import { type DateRange } from "react-day-picker";
import { Calendar } from "lucide-react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const Page = () => {
  const columns = orderColumns(formatCurrency);

  const [dialog, setDialog] = useState({
    open: false,
    id: "",
  });

  const [filters, setFilters] = useState<Record<string, any>>({
    date: "today",
  });

  const sheetFilterConfig: FilterConfig[] = [
    {
      label: "Rentang Tanggal Pesanan (Date Range)",
      column: "date_range",
      type: "daterange",
    },
    {
      label: "Pilih Tanggal Tertentu (Specific Date)",
      column: "specific_date",
      type: "date",
    },
    {
      label: "Status Pesanan",
      column: "status",
      type: "select",
      options: [
        { label: "Semua Status", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Preparing", value: "preparing" },
        { label: "Served", value: "served" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      label: "Tipe Pesanan",
      column: "type",
      type: "select",
      options: [
        { label: "Semua Tipe", value: "all" },
        { label: "Dine In", value: "dine_in" },
        { label: "Takeaway", value: "takeaway" },
        { label: "Delivery", value: "delivery" },
      ],
    },
  ];

  const queryParams = useMemo(() => {
    return {
      select:
        "*, table_spot(name), user_account(name), order_item(*, menu_item(*)) ",
      order: "desc" as const,
      sort: "created_at" as const,
    };
  }, []);

  const { data, isLoading, refetch } = useGetResourceQuery({
    resource: "order_table",
    params: queryParams,
  });

  const tableData = useMemo(() => {
    if (!data?.data) return [];
    let items = data.data;

    // 1. Sheet Filter: Date Range (uses effective date: schedule date if scheduled, else created_at)
    if (filters.date_range && typeof filters.date_range === "object") {
      const range = filters.date_range as DateRange;
      if (range.from) {
        const fromDate = new Date(range.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = range.to ? new Date(range.to) : new Date(range.from);
        toDate.setHours(23, 59, 59, 999);

        items = items.filter((item) => {
          const effective = getOrderEffectiveDate(item);
          return effective >= fromDate && effective <= toDate;
        });
      }
    }

    // 2. Sheet Filter: Specific Date (uses effective date)
    if (filters.specific_date) {
      const target = new Date(filters.specific_date);
      if (!isNaN(target.getTime())) {
        items = items.filter((item) => {
          const effective = getOrderEffectiveDate(item);
          return (
            effective.getFullYear() === target.getFullYear() &&
            effective.getMonth() === target.getMonth() &&
            effective.getDate() === target.getDate()
          );
        });
      }
    }

    // 3. Badge Quick Filter: Schedule / Date (only applies if no custom date / date_range is active from SheetFilter)
    const hasCustomDate = Boolean(
      (filters.date_range as DateRange)?.from || filters.specific_date
    );

    if (!hasCustomDate) {
      if (filters.date === "today") {
        items = items.filter((item) => isOrderEffectiveToday(item));
      } else if (filters.date === "scheduled") {
        items = items.filter((item) => {
          const schedule = parseOrderSchedule(item);
          return schedule.isScheduled;
        });
      }
    } else if (filters.date === "scheduled") {
      items = items.filter((item) => {
        const schedule = parseOrderSchedule(item);
        return schedule.isScheduled;
      });
    }

    // 4. Sheet Filter: Status
    if (filters.status && filters.status !== "all") {
      items = items.filter((item) => item.status === filters.status);
    }

    // 5. Sheet Filter: Type
    if (filters.type && filters.type !== "all") {
      items = items.filter((item) => item.type === filters.type);
    }

    return items.map((item) => ({
      id: `#${item.order_number}`,
      ...item,
    }));
  }, [data?.data, filters]);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to all changes on order_table
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_table",
        },
        () => {
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading orders...</div>;
  }

  const hasCustomDate = Boolean(
    (filters.date_range as DateRange)?.from || filters.specific_date
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Order Management</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pantau dan kelola semua pesanan pelanggan, antrean meja, dan jadwal pesanan.
          </p>
        </div>
      </div>

      {hasCustomDate && (
        <div className="flex items-center justify-between mb-3 px-3.5 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              <strong>Filter Tanggal Aktif:</strong>{" "}
              {(filters.date_range as DateRange)?.from ? (
                <>
                  {(filters.date_range as DateRange).from?.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {(filters.date_range as DateRange).to &&
                    ` - ${(filters.date_range as DateRange).to?.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`}
                </>
              ) : filters.specific_date ? (
                new Date(filters.specific_date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              ) : null}
            </span>
          </div>
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                date_range: undefined,
                specific_date: undefined,
              }))
            }
            className="text-xs font-bold text-destructive hover:underline cursor-pointer ml-2"
          >
            Hapus Filter Tanggal
          </button>
        </div>
      )}

      <AdvancedTable
        columns={columns}
        data={tableData}
        filterConfig={[
          {
            label: "Schedule / Date",
            column: "date",
            type: "badge",
            options: [
              { label: "Today", value: "today" },
              { label: "Scheduled", value: "scheduled" },
              { label: "All time", value: "all time" },
            ],
          },
        ]}
        sheetFilterConfig={sheetFilterConfig}
        filters={filters}
        onFiltersChange={(newFilters) =>
          setFilters(newFilters as Record<string, any>)
        }
        addButton={{
          text: "Add New Order",
          onClick: () =>
            setDialog((prev) => ({ ...prev, open: true, id: "new" })),
        }}
        row_click={(id) => setDialog({ id: id || "", open: true })}
      />
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        modal={false}
      >
        <DialogContent className="max-w-4xl sm:max-w-4xl w-full max-h-[85vh] overflow-y-auto">
          <DialogTitle className="mb-2">
            {dialog.id === "new" ? "Create New Order" : "Order Details"}
          </DialogTitle>
          <OrderForm
            id={dialog.id}
            onSuccess={() => {
              setDialog((prev) => ({ ...prev, open: false, id: "" }));
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Page;
