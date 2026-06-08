import { DataForm } from "@/components/ui/data-form/data-form";
import { useCreateResourceMutation } from "@/store/services/flexible-querry";
import { createClient } from "@/utils/supabase/client";
import React from "react";
import { toast } from "sonner";

export const CategoryForm = ({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess?: () => void;
}) => {
  const isNew = id === "new";
  const [create] = useCreateResourceMutation();
  const handleSubmit = async (data: any) => {
    try {
      await create({
        resource: "category",
        body: {
          ...data,
        },
      });
      onSuccess?.();
      toast.success("Category saved successfully");
    } catch (error) {
      console.error("Error inserting category:", error);
      toast.error("Failed to save category");
    }
  };
  const handleDelete = async () => {};

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
      onDelete={handleDelete}
      deleteLabel="Delete"
      onSubmit={handleSubmit}
      submitButtonPosition="bottom"
    />
  );
};
