"use client";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import { orderColumns } from "./order";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { OrderForm } from "./order-form";
import { useGetResourceQuery } from "@/store/services/flexible-querry";
import { createClient } from "@/utils/supabase/client";

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

  const { data, isLoading, refetch } = useGetResourceQuery({
    resource: "order_table",
    params: {
      select: "*, table_spot(name), user_account(name)",
      order: "desc",
      sort: "created_at",
    },
  });

  const [filters, setFilters] = useState<Record<string, any>>({
    date: "today",
  });

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

  const filteredData = (data?.data || []).filter((order) => {
    if (filters.date === "today") {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear()
      );
    }
    return true;
  });

  return (
    <>
      <h3 className="text-xl font-semibold mb-4">Order Management</h3>
      <AdvancedTable
        columns={columns}
        data={filteredData}
        filterConfig={[
          {
            label: "Date",
            column: "date",
            type: "badge",
            options: [
              { label: "Today", value: "today" },
              { label: "All time", value: "all time" },
            ],
          },
        ]}
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(newFilters as Record<string, any>)}
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
