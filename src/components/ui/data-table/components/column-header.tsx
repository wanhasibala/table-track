"use client";

import { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreateTableOptions } from "@/lib/create-table-column";

interface DataTableColumnHeaderProps<TData, TValue> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  column: Column<TData, TValue>;
  title: string | React.ReactNode;
  custom?: Required<
    CreateTableOptions<TData extends { id: string } ? TData : never>
  >["customColumns"];
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  custom,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const isReactNode = typeof title !== "string";
  const displayTitle = isReactNode ? title : title;
  const columnWidth = column.getSize();
  
  if (!column.getCanSort()) {
    return (
      <div
        className={cn(className)}
        style={{ width: columnWidth === 150 ? undefined : `${columnWidth}px` }}
      >
        {displayTitle}
      </div>
    );
  }

  const fixedTitle =
    typeof title === "string" ? title.split("_").join(" ") : title;

  return (
    <div
      className={cn("flex items-center space-x-2 h-full", className)}
      // style={{ width: `${columnWidth}px` }}
    >
      <Button
        variant={"ghost"}
        className="flex px-2 items-center w-full  h-full bg-transparent capitalize font-semibold text-primary dark:text-secondary"
      >
        <span>{fixedTitle}</span>
      </Button>
    </div>
  );
}
