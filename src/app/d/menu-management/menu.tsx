"use client";
import { createTableColumns } from "@/lib/create-table-column";

export const column = () => {
  const sampleData = {
    id: "",
    name: "",
    price: 0,
    category: "",
    available: true,
    stock: 0,
  };
  return createTableColumns(sampleData, {
    customColumns: {
      price: {
        cell(value) {
          return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(Number(value));
        },
      },
    },
  });
};
