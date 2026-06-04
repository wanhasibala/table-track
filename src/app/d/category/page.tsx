"use client";
import { AdvancedTable } from "@/components/ui/data-table/advanced-table";
import { columnCategory } from "./category";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm } from "./category-form";

const page = () => {
  const columns = columnCategory();
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState({
    search: "",
  });
  const [dialog, setDialog] = useState({
    open: false,
    id: "",
  });
  const supabase = createClient();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await supabase.from("category").select("*");
        setData(response.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([]);
        toast.error("Failed to fetch data");
      }
    };
    fetchData();
  }, [setData]);
  return (
    <>
      <h3 className="text-xl font-semibold">Category </h3>
      <AdvancedTable
        columns={columns}
        data={data}
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
            {dialog.id === "new" ? "New Category" : "Edit Cateogyr"}
          </DialogTitle>
          <CategoryForm id={dialog.id} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default page;
