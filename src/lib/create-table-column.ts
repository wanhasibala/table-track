"use client";
import * as React from "react";
import { type ColumnDef, type Column } from "@tanstack/react-table";
import {
  ColumnDefWithInputType,
  InputOption,
} from "../components/ui/table-edit/table-edit";
import { DataTableColumnHeader } from "../components/ui/data-table";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { MoreHorizontal, LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export interface InputTypeConfig {
  type?:
  | "text"
  | "number"
  | "date"
  | "select"
  | "textarea"
  | "checkbox"
  | "dimensions";
  options?: InputOption[];
  multiple?: boolean;
  alwaysEditing?: boolean;
}

export type CustomColumn<T, K extends keyof T = keyof T> = {
  header?: string | React.ReactNode;
  cell?: (value: T[K], row: T) => React.ReactNode;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  inputType?: InputTypeConfig;
  alwaysEditing?: boolean;
  enableSorting?: boolean;
  // NEW: Support for virtual columns (combining multiple fields)
  accessorFn?: (row: T) => any;
  sourceKeys?: Array<keyof T>; // Keys to exclude from base columns when using accessorFn
};

export interface ActionItem<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (data: T) => void;
  className?: string;
}

export interface CreateTableOptions<T extends { id: string }> {
  actions?: {
    items: ActionItem<T>[];
    menuTriggerIcon?: LucideIcon;
  };
  checkboxSelection?: boolean;
  excludeKeys?: Array<keyof T>;
  customColumns?: {
    [K in keyof T]?: CustomColumn<T, K>;
  };
}

function TableActions<T extends { id: string }>({
  row,
  actions,
}: {
  row: { original: T };
  actions: NonNullable<CreateTableOptions<T>["actions"]>;
}) {
  const Icon = actions.menuTriggerIcon || MoreHorizontal;

  return React.createElement(
    DropdownMenu,
    {},
    React.createElement(
      DropdownMenuTrigger,
      { asChild: true },
      React.createElement(
        Button,
        { className: "h-8 w-8 p-0" },
        React.createElement("span", { className: "sr-only" }, "Open menu"),
        React.createElement(Icon, { className: "h-4 w-4" }),
      ),
    ),
    React.createElement(
      DropdownMenuContent,
      { align: "end" },
      actions.items.map((item, index) => {
        const Icon = item.icon;
        return React.createElement(
          DropdownMenuItem,
          {
            key: index,
            onClick: () => item.onClick(row.original),
            className: item.className,
          },
          [
            Icon &&
            React.createElement(Icon, {
              key: "icon",
              className: "mr-2 h-4 w-4",
            }),
            item.label,
          ],
        );
      }),
    ),
  );
}

type TypedColumn<T> = Column<T, unknown>;

export function createTableColumns<T extends { id: string }>(
  sampleData: T,
  options: CreateTableOptions<T> = {},
): ColumnDefWithInputType<T, unknown>[] {
  const {
    excludeKeys = ["id"] as Array<keyof T>,
    actions,
    checkboxSelection,
    customColumns = {} as Required<CreateTableOptions<T>>["customColumns"],
  } = options;

  const keys = Object.keys(sampleData).filter(
    (key) => !excludeKeys.includes(key as keyof T),
  ) as Array<keyof T>;

  const baseColumns: ColumnDefWithInputType<T, unknown>[] = keys.map((key) => {
    const custom = customColumns[key];
    const headerContent = custom?.header || String(key);
    const column: ColumnDefWithInputType<T, unknown> = {
      id: String(key),
      accessorKey: key,
      header: ({ column }: { column: TypedColumn<T> }) =>
        React.createElement(DataTableColumnHeader as any, {
          column: column,
          title: headerContent,
          custom: custom,
        }),
      cell: ({ row }) => {
        const value = row.getValue(String(key));
        if (custom?.cell) {
          return React.createElement(
            "div",
            { className: "text-left w-full" },
            custom.cell(value as T[keyof T], row.original),
          );
        }

        return React.createElement(
          "div",
          { className: "text-left w-full overflow-hidden truncate" },
            typeof value === "boolean"
              ? React.createElement(Checkbox, {
                checked: value,
              })
              : typeof value === "object"
                ? JSON.stringify(value)
                : String(value),
        );
      },
      inputType: custom?.inputType,
      enableSorting: custom?.enableSorting !== false ? true : false,
    };

    if (custom?.width) column.size = custom.width;
    if (custom?.minWidth) column.minSize = custom.minWidth;
    if (custom?.maxWidth) column.maxSize = custom.maxWidth;

    return column;
  });

  let finalColumns = baseColumns;

  if (checkboxSelection) {
    const checkboxColumn: ColumnDefWithInputType<T, unknown> = {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      size: 40,
      header: ({ table }) =>
        React.createElement(Checkbox, {
          checked: table.getIsAllPageRowsSelected(),
          onCheckedChange: (value: boolean) =>
            table.toggleAllPageRowsSelected(!!value),
          "aria-label": "Select all",
        }),
      cell: ({ row }) =>
        React.createElement(Checkbox, {
          checked: row.getIsSelected(),
          onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
          "aria-label": "Select row",
        }),
    };
    finalColumns = [checkboxColumn, ...finalColumns];
  }

  if (actions) {
    const actionsColumn: ColumnDefWithInputType<T, unknown> = {
      id: "actions",
      cell: ({ row }) => React.createElement(TableActions<T>, { row, actions }),
    };
    finalColumns = [...finalColumns, actionsColumn];
  }

  return finalColumns;
}

export interface CreateEditTableOptions<T extends { id: string }> {
  excludeKeys?: Array<keyof T>;
  customColumns?: {
    [key: string]: CustomColumn<T, any>; // Changed to allow string keys for virtual columns
  };
}

export function createTableEditColumns<T extends { id: string }>(
  sampleData: T,
  options: CreateEditTableOptions<T> = {},
): ColumnDefWithInputType<T, unknown>[] {
  const { excludeKeys = ["id"] as Array<keyof T>, customColumns = {} } =
    options;

  // Collect all source keys from virtual columns to exclude them
  const virtualColumnSourceKeys = new Set<keyof T>();
  Object.values(customColumns).forEach((col) => {
    if (col.sourceKeys) {
      col.sourceKeys.forEach((key) => virtualColumnSourceKeys.add(key));
    }
  });

  // Get all keys from sample data except excluded ones and source keys
  const keys = Object.keys(sampleData).filter(
    (key) =>
      !excludeKeys.includes(key as keyof T) &&
      !virtualColumnSourceKeys.has(key as keyof T),
  ) as Array<keyof T>;

  // Create columns from existing keys
  const baseColumns: ColumnDefWithInputType<T, unknown>[] = keys.map((key) => {
    const columnDef = customColumns[String(key)] || {};
    const column: ColumnDefWithInputType<T, unknown> = {
      id: String(key),
      accessorKey: key,
      header: ({ column }: { column: TypedColumn<T> }) =>
        React.createElement(DataTableColumnHeader as any, {
          column: column,
          title: columnDef.header || String(key),
        }),
      cell: ({ row }) => {
        const value = row.getValue(String(key));
        if (columnDef.cell) {
          return React.createElement(
            "div",
            { className: "text-center" },
            columnDef.cell(value as T[keyof T], row.original),
          );
        }
        return React.createElement(
          "div",
          { className: "text-center" },
          typeof value === "object"
            ? JSON.stringify(value)
            : String(value),
        );
      },
      inputType: columnDef.inputType
        ? {
          type: columnDef.inputType.type,
          options: columnDef.inputType.options,
          multiple: columnDef.inputType.multiple,
          alwaysEditing: columnDef.alwaysEditing,
        }
        : undefined,
    };

    if (columnDef.width) column.size = columnDef.width;
    if (columnDef.minWidth) column.minSize = columnDef.minWidth;
    if (columnDef.maxWidth) column.maxSize = columnDef.maxWidth;

    return column;
  });

  // Add virtual columns (columns with accessorFn)
  const virtualColumns: ColumnDefWithInputType<T, unknown>[] = Object.entries(
    customColumns,
  )
    .filter(([_, col]) => col.accessorFn)
    .map(([key, columnDef]) => {
      const column: ColumnDefWithInputType<T, unknown> = {
        id: key,
        accessorFn: columnDef.accessorFn!,
        header: ({ column }: { column: TypedColumn<T> }) =>
          React.createElement(DataTableColumnHeader as any, {
            column: column,
            title: columnDef.header || key,
          }),
        cell: ({ row }) => {
          const value = row.getValue(key);
          if (columnDef.cell) {
            return React.createElement(
              "div",
              { className: "text-center" },
              columnDef.cell(value as any, row.original),
            );
          }
          return React.createElement(
            "div",
            { className: "text-center" },
            typeof value === "object"
              ? JSON.stringify(value)
              : String(value),
          );
        },
        inputType: columnDef.inputType
          ? {
            type: columnDef.inputType.type,
            options: columnDef.inputType.options,
            multiple: columnDef.inputType.multiple,
            alwaysEditing: columnDef.alwaysEditing,
          }
          : undefined,
      };

      if (columnDef.width) column.size = columnDef.width;
      if (columnDef.minWidth) column.minSize = columnDef.minWidth;
      if (columnDef.maxWidth) column.maxSize = columnDef.maxWidth;

      return column;
    });

  return [...baseColumns, ...virtualColumns];
}

export function createStatusCell<T extends string>(
  getColor: (status: T) => { bg: string; text: string },
) {
  return (value: T) => {
    const { bg, text } = getColor(value);
    return React.createElement(
      "div",
      {
        className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg} ${text} capitalize`,
      },
      value,
    );
  };
}

export function createDateCell(format?: string) {
  return (value: string | Date) => {
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toLocaleDateString(
      "en-US",
      format ? undefined : { year: "numeric", month: "short", day: "numeric" },
    );
  };
}

export function createBooleanCell(
  options: {
    trueText?: string;
    falseText?: string;
    trueClass?: string;
    falseClass?: string;
  } = {},
) {
  const {
    trueText = "Yes",
    falseText = "No",
    trueClass = "bg-green-50 text-green-700",
    falseClass = "bg-red-50 text-red-700",
  } = options;

  return (value: boolean) =>
    React.createElement(
      "div",
      {
        className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${value ? trueClass : falseClass}`,
      },
      value ? trueText : falseText,
    );
}
