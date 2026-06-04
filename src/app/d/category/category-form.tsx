import { DataForm } from "@/components/ui/data-form/data-form";
import { createClient } from "@/utils/supabase/client";
import React from "react";
import { toast } from "sonner";

export const CategoryForm = ({ id }: { id: string }) => {
  const isNew = id === "new";
  const supabase = createClient();
  const handleSubmit = async (data: any) => {
    try {
      await supabase.from("category").insert({
        ...data,
      });
      toast.success("Category saved successfully");
    } catch (error) {
      console.error("Error inserting category:", error);
      toast.error("Failed to save category");
    }
  };

  return (
    <DataForm
      fields={[
        { label: "Name", name: "name", type: "text" },
        { label: "Sort Order", name: "sort_order", type: "number" },
        {
          label: "Active",
          name: "is_active",
          type: "checkbox",
        },
      ]}
      onSubmit={handleSubmit}
      submitButtonPosition="bottom"
    />
  );
};
