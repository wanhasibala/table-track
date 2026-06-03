import { DataForm } from "@/components/ui/data-form/data-form";
import React from "react";

export const MenuForm = ({ id }: { id: string }) => {
  const isNew = id === "new";
  return (
    <DataForm
      fields={[{ label: "Name", name: "name", type: "text" }]}
      onSubmit={(data) => {}}
      submitButtonPosition="bottom"
    />
  );
};
