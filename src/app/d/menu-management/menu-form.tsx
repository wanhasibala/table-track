import { DataForm } from "@/components/ui/data-form/data-form";
import { createClient } from "@/utils/supabase/client";
import React from "react";

export const MenuForm = ({ id }: { id: string }) => {
  const isNew = id === "new";
  const supabase = createClient();
  return (
    <DataForm
      fields={[
        { label: "Name", name: "name", type: "text" },
        {
          label: "Category",
          name: "category_id",
          type: "text",
          loadOptions: async (searchTerm) => {
            try {
              const response = await supabase
                .from("category")
                .select("*")
                .ilike("name", searchTerm);
              return response || [];
            } catch (error) {
              console.error("Error fetching categories:", error);
              return [];
            }
          },
        },
      ]}
      onSubmit={(data) => {}}
      submitButtonPosition="bottom"
    />
  );
};
