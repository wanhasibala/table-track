"use client";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import React, { useMemo, useState } from "react";
import { column } from "./menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MenuForm } from "./menu-form";
import { useGetResourceQuery } from "@/store/services/flexible-querry";

const page = () => {
  const columns = column();
  const [dialog, setDialog] = useState({
    open: false,
    id: "",
  });
  const [filter, setFilter] = useState({
    search: "",
  });
  const { data, isLoading, refetch } = useGetResourceQuery({
    resource: "menu_item",
    params: {
      select: "*, category(name)",
    },
  });
  const menuData = useMemo(() => {
    return (
      data?.data.map((item) => ({
        ...item,
        category: item.category.name || "",
        available: item.is_available,
      })) || []
    );
  }, [data]);

  return (
    <>
      <h3 className="text-xl font-semibold">Menu Management</h3>
      <AdvancedTable
        columns={columns}
        data={menuData}
        addButton={{
          text: "Add New Menu",
          onClick: () =>
            setDialog((prev) => ({ ...prev, open: true, id: "new" })),
        }}
        row_click={(id) => setDialog({ id: id || "", open: true })}
      />
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <MenuForm
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

export default page;
