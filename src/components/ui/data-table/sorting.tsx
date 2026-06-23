"use client";
import React, { use } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../popover";
import { Button } from "../button";
import { ArrowUpDown, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { SortButtonConfig } from "./advanced-table";
import { IconRenderer } from "./advanced-table";
import { cn } from "@/lib/utils";
import { Separator } from "@radix-ui/react-menubar";
import { SheetFilter } from "./sheet-filter";
import { FilterConfig, FilterValue } from "./filter";

interface SortingProps<TData extends { id: string }> {
  sortButtons?: SortButtonConfig<TData>[];
  filters?: { [key: string]: FilterValue };
  sheetFilterConfig?: FilterConfig[];
  useSheetFilter?: boolean;
  onFiltersChange?: (filters: { [key: string]: FilterValue }) => void;
}

export default function Sorting({
  sortButtons,
  useSheetFilter,
  filters,
  sheetFilterConfig,
  onFiltersChange,
}: SortingProps<{ id: string }>) {
  const hasSorting = sortButtons;
  const hasFiltering =
    useSheetFilter &&filters && onFiltersChange;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <ArrowUpDown className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex flex-col">
        {/* Sorting Buttons */}
        {hasSorting &&
          sortButtons?.map((sort, index) => {
            const isActive = sort.sortState && sort.sortState !== "none";
            const getIcon = () => {
              if (sort.sortState === "asc") {
                return sort.ascendingIcon || ChevronUp;
              } else if (sort.sortState === "desc") {
                return sort.descendingIcon || ChevronDown;
              }
              return ArrowUpDown;
            };
            return (
              <React.Fragment key={String(sort.column)}>
                <Button
                  className={cn(
                    "flex items-center justify-start gap-2",
                    isActive && "bg-accent",
                  )}
                  variant={"ghost"}
                  onClick={sort.onClick}
                >
                  <span
                    className={cn(
                      isActive ? "text-primary font-medium" : "text-foreground",
                    )}
                  >
                    {sort.label}
                  </span>
                  <IconRenderer
                    icon={getIcon()}
                    className={cn(
                      "ml-auto h-4 w-4",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </Button>
                {index < sortButtons.length - 1 && <Separator />}
              </React.Fragment>
            );
          })}

        {/* Filtering */}
        {hasFiltering && (
          <>
            {hasSorting && <Separator className="my-2" />}
            <SheetFilter
              filters={filters!}
              config={sheetFilterConfig || []}
              onChange={onFiltersChange!}
            />
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
