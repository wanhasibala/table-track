import { DataForm } from "@/components/ui/data-form/data-form";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  useLazyGetResourceQuery,
  useCreateResourceMutation,
  useGetResourceByIdQuery,
  useUpdateResourceMutation,
  useGetResourceQuery,
} from "@/store/services/flexible-querry";
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
  const [update] = useUpdateResourceMutation();
  const { uploadFile } = useFileUpload();

  // Load menu items list to verify limits
  const { data: menuItemsData } = useGetResourceQuery({
    resource: "menu_item",
  });
  
  // Get active tenant subscription tier
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const tenantId = user?.tenant_id;
  
  const { data: tenantData } = useGetResourceByIdQuery(
    { resource: "tenant", id: tenantId! },
    { skip: !tenantId }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      if (Array.isArray(data.image_url)) {
        const uploadedUrls = await Promise.all(
          data.image_url.map(async (img: unknown) => {
            if (img instanceof File) {
              const response = await uploadFile(img, {
                bucket: "assets",
                folder: "menu-images",
              });
              return response;
            }
            return img;
          })
        );
        data.image_url = uploadedUrls;
      } else if (data.image_url instanceof File) {
        const response = await uploadFile(data.image_url, {
          bucket: "assets",
          folder: "menu-images",
        });
        data.image_url = [response];
      }

      if (isNew) {
        const tier = tenantData?.data?.subscription_tier || "free";
        const count = menuItemsData?.data?.length || 0;
        if (tier === "free" && count >= 5) {
          toast.error("You've reached the free tier limit of 5 menu items. Please upgrade to Pro to add more!");
          return;
        }
        
        await create({
          resource: "menu_item",
          body: data,
        }).unwrap();
      } else {
        await update({
          resource: "menu_item",
          id,
          body: data,
        }).unwrap();
      }

      toast.success("Menu item submitted successfully!");
      if (onSuccess) onSuccess();
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
        { label: "Image", name: "image_url", type: "images" },
        { label: "Name", name: "name", type: "text" },
        {
          label: "Category",
          name: "category_id",
          type: "select-async",
          loadOptions: async (_searchTerm) => {
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
        { label: "Stock", name: "stock", type: "number" },
      ]}
      onSubmit={handleSubmit}
      initialData={data?.data}
      submitButtonPosition="bottom"
    />
  );
};
