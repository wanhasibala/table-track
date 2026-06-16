"use client";

import { createTableColumns } from "@/lib/create-table-column";

export const columnTableSpot = (tenantSlug: string) => {
  const sampleData = {
    id: "",
    name: "",
    is_active: true,
  };

  const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return createTableColumns(sampleData, {
    customColumns: {
      name: {
        header: "Table Name",
      },
      is_active: {
        header: "Status",
      },
    },
  });
};
