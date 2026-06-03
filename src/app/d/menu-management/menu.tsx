"use client";
import { createTableColumns } from "@/lib/create-table-column";

export const column = () => {
  const sampleData = {
    id: "",
    name: "",
    description: "",
    price: 0,
    category: "",
    available: true,
    stock: 0,
  };
  return createTableColumns(sampleData);
};
