"use client";

import { createTableColumns } from "@/lib/create-table-column";

export const columnCategory = () => {
  const sampleData = {
    id: "",
    name: "",
    sort_order: 0,
    is_active: true,
  };
  return createTableColumns(sampleData);
};
