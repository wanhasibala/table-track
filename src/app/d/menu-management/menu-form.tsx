import { DataForm } from "@/components/ui/data-form/data-form";
import {
  useLazyGetResourceQuery,
  useCreateResourceMutation,
  useGetResourceByIdQuery,
} from "@/store/services/flexible-querry";
import { createClient } from "@/utils/supabase/client";
import React from "react";
import { toast } from "sonner";

export const MenuForm = ({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess?: () => void;
}) => {
  const isNew = id === "new";
  const { data, isLoading } = useGetResourceByIdQuery(
    {
      resource: "menu_item",
      id,
      params: {
        select: "*, category(name)",
      },
    },
    {
      skip: isNew,
    },
  );
  const [fetchCategory] = useLazyGetResourceQuery();
  const [create] = useCreateResourceMutation();
  const handleSubmit = async (data: any) => {
    try {
      const response = await create({
        resource: "menu_item",
        body: data,
      }).unwrap();
      toast.success("Menu item submitted successfully!");
      onSuccess && onSuccess();
    } catch (error) {
      console.error("Error submitting menu item:", error);
      toast.error("Failed to submit menu item. Please try again.");
    }
  };
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <DataForm
      fields={[
        { label: "Name", name: "name", type: "text" },
        {
          label: "Category",
          name: "category_id",
          type: "select-async",
          loadOptions: async (searchTerm) => {
            try {
              const response = await fetchCategory({
                resource: "category",
              }).unwrap();
              return response.data.map((cat) => ({
                value: cat.id,
                label: cat.name,
              }));
            } catch (error) {
              console.error("Error fetching categories:", error);
              return [];
            }
          },
        },
        { label: "Price", name: "price", type: "number" },
        { label: "Image", name: "image_url", type: "file" },
        { label: "Stock", name: "stock", type: "number" },
      ]}
      onSubmit={handleSubmit}
      initialData={data?.data}
      submitButtonPosition="bottom"
    />
  );
};
