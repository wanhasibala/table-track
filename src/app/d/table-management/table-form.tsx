import React from "react";
import { DataForm } from "@/components/ui/data-form/data-form";
import {
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useGetResourceByIdQuery,
  useGetResourceQuery,
} from "@/store/services/flexible-querry";
import { toast } from "sonner";

export const TableForm = ({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess?: () => void;
}) => {
  const isNew = id === "new";
  const [create] = useCreateResourceMutation();
  const [update] = useUpdateResourceMutation();

  const { data: tableData, isLoading } = useGetResourceByIdQuery(
    {
      resource: "table_spot",
      id,
    },
    {
      skip: isNew,
    }
  );

  // Fetch existing table spots to enforce limits
  const { data: existingTables } = useGetResourceQuery({
    resource: "table_spot",
  });

  // Get active tenant subscription tier
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const tenantId = user?.tenant_id;

  const { data: tenantData } = useGetResourceByIdQuery(
    { resource: "tenant", id: tenantId! },
    { skip: !tenantId }
  );

  const handleSubmit = async (data: any) => {
    try {
      if (isNew) {
        const tier = tenantData?.data?.subscription_tier || "free";
        const count = existingTables?.data?.length || 0;

        if (tier === "free" && count >= 3) {
          toast.error("You've reached the free tier limit of 3 table spots. Please upgrade to Pro to add more!");
          return;
        }

        await create({
          resource: "table_spot",
          body: {
            ...data,
            tenant_id: tenantId,
          },
        }).unwrap();
      } else {
        await update({
          resource: "table_spot",
          id,
          body: data,
        }).unwrap();
      }
      onSuccess?.();
      toast.success("Table spot saved successfully!");
    } catch (error) {
      console.error("Error saving table spot:", error);
      toast.error("Failed to save table spot. Please try again.");
    }
  };

  const handleDelete = async () => {
    // Delete handling can be integrated if supported by DataForm delete action
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading table spot details...</div>;
  }

  return (
    <DataForm
      fields={[
        { label: "Table Name / Number", name: "name", type: "text" },
        {
          label: "Active",
          name: "is_active",
          type: "checkbox",
        },
      ]}
      initialData={tableData?.data}
      onSubmit={handleSubmit}
      submitButtonPosition="bottom"
    />
  );
};
