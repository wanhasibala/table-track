"use client";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import { columnCategory } from "./category";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm } from "./category-form";
import { useGetResourceQuery } from "@/store/services/flexible-querry";

const page = () => {
  const columns = columnCategory();

  const [dialog, setDialog] = useState({
    open: false,
    id: "",
  });
  const { data, isLoading, refetch } = useGetResourceQuery({
    resource: "category",
    params: {
      order: "asc",
      sort: "sort_order",
    },
  });

  return (
    <>
      <h3 className="text-xl font-semibold">Category </h3>
      <AdvancedTable
        columns={columns}
        data={data?.data || []}
        addButton={{
          text: "Add Category",
          onClick: () =>
            setDialog((prev) => ({ ...prev, open: true, id: "new" })),
        }}
      />
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogTitle>
            {dialog.id === "new" ? "New Category" : "Edit Category"}
          </DialogTitle>
          <CategoryForm
            id={dialog.id}
            onSuccess={() => {
              setDialog((prev) => ({ ...prev, open: false }));
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default page;
