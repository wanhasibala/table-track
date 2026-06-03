import { FilterValue } from "./filter";

export const handleFiltersChange = (
  newFilters: Record<string, FilterValue>,
  setFilters: (prev) => void,
  setCurrentPage: (prev: number) => void,
) => {
  setFilters((prev) => {
    const stringFilters: Record<string, string> = {};
    for (const [key, value] of Object.entries(newFilters)) {
      if (typeof value === "string") {
        stringFilters[key] = value;
      }
    }
    return { ...prev, ...stringFilters };
  });
  setCurrentPage(1);
};
