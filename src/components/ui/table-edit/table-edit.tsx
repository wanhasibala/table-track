"use client";

import * as React from "react";
import {
  ColumnDef,
  Table,
  flexRender,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { shortDate } from "@/lib/date";

import {
  Table as TableUI,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * A table component that supports hierarchical data with expand/collapse functionality
 * @param columns - Column definitions for the table
 * @param data - Array of data items to display. Each item must have an id and optional id_parent field
 * @param row_click - Optional callback function when a row is clicked
 */
interface DataTableProps<
  TData extends { id: string; id_parent?: string | null; level?: number },
  TValue
> {
  columns: ColumnDefWithInputType<TData, TValue>[];
  data: TData[];
  row_click?: (row: TData) => void;
  onRowUpdate?: (rowIndex: number, columnId: string, value: any) => void;
  addButtonLabel?: string;
  onAdd?: () => void;
  onDelete?: (rowIndex: number) => void;
  alwaysEditing?: boolean;
}

interface InputOption {
  label: string;
  value: string;
}

export interface ColumnOptions {
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

export type ColumnDefWithInputType<TData, TValue> = ColumnDef<TData, TValue> & {
  inputType?: ColumnOptions;
  size?: number;
  minSize?: number;
  maxSize?: number;
};

export type { InputOption };

declare module "@tanstack/table-core" {
  interface TableMeta<TData> {
    expandedRows?: Set<string>;
    setExpandedRows?: (
      value: Set<string> | ((prev: Set<string>) => Set<string>)
    ) => void;
    editedCell?: { rowIndex: number; columnId: string } | null;
    setEditedCell?: (
      value: { rowIndex: number; columnId: string } | null
    ) => void;
    updateData?: (rowIndex: number, columnId: string, value: any) => void;
  }
}

export function DataTable<
  TData extends { id: string; id_parent?: string | null; level?: number },
  TValue
>({
  columns,
  data,
  row_click,
  onRowUpdate,
  addButtonLabel,
  onAdd,
  onDelete,
  alwaysEditing = false,
}: DataTableProps<TData, TValue>) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(
    new Set()
  );
  const [editedCell, setEditedCell] = React.useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      expandedRows,
      setExpandedRows,
      editedCell,
      setEditedCell,
      updateData: (rowIndex: number, columnId: string, value: any) => {
        onRowUpdate?.(rowIndex, columnId, value);
        setEditedCell(null);
      },
    },
  });
  const toggleRow = (rowId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    table.options.meta?.setExpandedRows?.((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const isRowExpanded = (rowId: string) =>
    table.options.meta?.expandedRows?.has(rowId) ?? false;

  const shouldRenderRow = (row: { original: TData }) => {
    // If tree feature is disabled, show all rows

    const parentId = row.original.id_parent;

    // If row has no parent or parent is null/empty, always show it (root level)
    if (!parentId || parentId === "null" || parentId === "") return true;

    // Otherwise, only show if parent is expanded
    return isRowExpanded(parentId);
  };
  return (
    <div className="space-y-4">
      {addButtonLabel && onAdd && (
        <Button onClick={onAdd} variant="outline">
          {addButtonLabel}
        </Button>
      )}
      <ScrollArea className="border rounded-sm">
        <TableUI className="w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const isFirst = index === 0;
                  const isLast = index === headerGroup.headers.length - 1;
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "h-16 capitalize text-black font-medium whitespace-normal text-ellipsis align-middle p-2",
                        isFirst && "rounded-tl-md",
                        isLast && "rounded-tr-md"
                      )}
                      style={{
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="overflow-y-auto">
            {table.getRowModel().rows?.length ? (
              table
                .getRowModel()
                .rows.filter(shouldRenderRow)
                .map((row, index) => {
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => row_click?.(row.original)}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "border-b cursor-text transition-colors hover:bg-muted overflow-y-auto",
                        index % 2 === 1 && "bg-muted"
                      )}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const isLastCell =
                          cellIndex === row.getVisibleCells().length - 1;
                        return (
                          <TableCell
                            key={cell.id}
                            className="whitespace-normal text-ellipsis align-middle p-2"
                            style={{
                              width: cell.column.getSize(),
                              minWidth: cell.column.columnDef.minSize,
                              maxWidth: cell.column.columnDef.maxSize,
                            }}
                          >
                            <div
                              className="flex items-center cursor-text"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  !alwaysEditing &&
                                  !(
                                    cell.column
                                      .columnDef as ColumnDefWithInputType<
                                      TData,
                                      unknown
                                    >
                                  ).inputType?.alwaysEditing
                                ) {
                                  const rowIndex = row.index;
                                  const columnId = cell.column.id;
                                  setEditedCell({ rowIndex, columnId });
                                }
                              }}
                            >
                              {alwaysEditing ||
                              (
                                cell.column.columnDef as ColumnDefWithInputType<
                                  TData,
                                  unknown
                                >
                              ).inputType?.alwaysEditing ||
                              (editedCell?.rowIndex === row.index &&
                                editedCell?.columnId === cell.column.id) ? (
                                <>
                                  {(
                                    cell.column
                                      .columnDef as ColumnDefWithInputType<
                                      TData,
                                      unknown
                                    >
                                  ).inputType?.type === "select" ? (
                                    <Combobox
                                      options={
                                        (
                                          cell.column
                                            .columnDef as ColumnDefWithInputType<
                                            TData,
                                            unknown
                                          >
                                        ).inputType?.options || []
                                      }
                                      value={cell.getValue() as string}
                                      onChange={(value: string | string[] | null) => {
                                        if (value === null) return;
                                        table.options.meta?.updateData?.(
                                          row.index,
                                          cell.column.id,
                                          value
                                        );
                                      }}
                                      placeholder="Select option"
                                      className="w-full"
                                      multiple={
                                        (
                                          cell.column
                                            .columnDef as ColumnDefWithInputType<
                                            TData,
                                            unknown
                                          >
                                        ).inputType?.multiple
                                      }
                                    />
                                  ) : (
                                      cell.column
                                        .columnDef as ColumnDefWithInputType<
                                        TData,
                                        unknown
                                      >
                                    ).inputType?.type === "dimensions" ? (
                                    <div
                                      className="flex items-center gap-2 w-full"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          const inputs = e.currentTarget.querySelectorAll('input');
                                          const newValue = {
                                            x: inputs[0]?.value ? parseFloat(inputs[0].value) || null : null,
                                            y: inputs[1]?.value ? parseFloat(inputs[1].value) || null : null,
                                            z: inputs[2]?.value ? parseFloat(inputs[2].value) || null : null,
                                          };
                                          table.options.meta?.updateData?.(
                                            row.index,
                                            cell.column.id,
                                            newValue,
                                          );
                                        }
                                      }}
                                    >
                                      {(["x", "y", "z"] as const).map(
                                        (dim, idx) => {
                                          const currentValue =
                                            cell.getValue() as Record<
                                              string,
                                              any
                                            > | null;
                                          const value = currentValue?.[dim];
                                          console.log(value, "DIM VALUE");

                                          return (
                                            <React.Fragment key={dim}>
                                              <Input
                                                type="number"
                                                step="any"
                                                placeholder="0"
                                                defaultValue={
                                                  value !== undefined &&
                                                  value !== null
                                                    ? String(value)
                                                    : ""
                                                }
                                                className="flex-1"
                                              />
                                              {idx < 2 && (
                                                <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                              )}
                                            </React.Fragment>
                                          );
                                        }
                                      )}
                                    </div>
                                  ) : (
                                      cell.column
                                        .columnDef as ColumnDefWithInputType<
                                        TData,
                                        unknown
                                      >
                                    ).inputType?.type === "textarea" ? (
                                    <Textarea
                                      className="w-full"
                                      defaultValue={cell.getValue() as string}
                                      autoFocus
                                      onBlur={(e) => {
                                        table.options.meta?.updateData?.(
                                          row.index,
                                          cell.column.id,
                                          e.target.value
                                        );
                                        if (
                                          !alwaysEditing &&
                                          !(
                                            cell.column
                                              .columnDef as ColumnDefWithInputType<
                                              TData,
                                              unknown
                                            >
                                          ).inputType?.alwaysEditing
                                        ) {
                                          setEditedCell(null);
                                        }
                                      }}
                                    />
                                  ) : (
                                      cell.column
                                        .columnDef as ColumnDefWithInputType<
                                        TData,
                                        unknown
                                      >
                                    ).inputType?.type === "date" ? (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !cell.getValue() &&
                                              "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {cell.getValue()
                                            ? shortDate(
                                                new Date(
                                                  cell.getValue() as string
                                                )
                                              )
                                            : "Pick a date"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                      >
                                        <Calendar
                                          mode="single"
                                          selected={
                                            cell.getValue()
                                              ? new Date(
                                                  cell.getValue() as string
                                                )
                                              : undefined
                                          }
                                          onSelect={(date) => {
                                            table.options.meta?.updateData?.(
                                              row.index,
                                              cell.column.id,
                                              date?.toISOString()
                                            );
                                          }}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  ) : (
                                      cell.column
                                        .columnDef as ColumnDefWithInputType<
                                        TData,
                                        unknown
                                      >
                                    ).inputType?.type === "checkbox" ? (
                                    <Checkbox
                                      checked={cell.getValue() as boolean}
                                      onCheckedChange={(checked) => {
                                        table.options.meta?.updateData?.(
                                          row.index,
                                          cell.column.id,
                                          checked
                                        );
                                      }}
                                    />
                                  ) : (
                                    <Input
                                      className="w-full"
                                      defaultValue={cell.getValue() as string}
                                      type={
                                        (
                                          cell.column
                                            .columnDef as ColumnDefWithInputType<
                                            TData,
                                            unknown
                                          >
                                        ).inputType?.type || "text"
                                      }
                                      autoFocus
                                      onBlur={(e) => {
                                        table.options.meta?.updateData?.(
                                          row.index,
                                          cell.column.id,
                                          e.target.value
                                        );
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          table.options.meta?.updateData?.(
                                            row.index,
                                            cell.column.id,
                                            e.currentTarget.value
                                          );
                                          if (
                                            !alwaysEditing &&
                                            !(
                                              cell.column
                                                .columnDef as ColumnDefWithInputType<
                                                TData,
                                                unknown
                                              >
                                            ).inputType?.alwaysEditing
                                          ) {
                                            setEditedCell(null);
                                          }
                                        } else if (e.key === "Escape") {
                                          setEditedCell(null);
                                        }
                                      }}
                                    />
                                  )}
                                </>
                              ) : (
                                <div className="min-h-[24px]">
                                  {cell.getValue() === null ||
                                  cell.getValue() === "" ? (
                                    <span className="text-muted-foreground">
                                      Click to edit
                                    </span>
                                  ) : (
                                    flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                            {isLastCell && onDelete && (
                              <Button
                                variant="ghost"
                                className="ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(row.index);
                                }}
                              >
                                Delete
                              </Button>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableUI>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
