"use client";

import * as React from "react";
import { ColumnDef, Table, flexRender } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table as TableUI,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExpandableFeatures<TData> {
  getNestedData?: (parentData: TData) => any[];
  nestedColumns?: ColumnDef<any>[];
  renderExpandedContent?: (data: TData) => React.ReactNode;
}

interface DataTableProps<
  TData extends {
    id: string;
    id_parent?: string | null;
    level?: number;
    children?: TData[];
  },
  TValue,
> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  row_click?: (row: TData) => void;
  table: Table<TData>;
  features?: {
    tree: boolean;
    id_parent: string;
  };
  expandable?: ExpandableFeatures<TData>;
  onExpandRow?: (rowId: string, rowData: TData) => void | Promise<void>;
  onHeaderClick?: (columnId: string) => void;
}

declare module "@tanstack/table-core" {
  interface TableMeta<TData> {
    expandedRows?: Set<string>;
    setExpandedRows?: (
      value: Set<string> | ((prev: Set<string>) => Set<string>),
    ) => void;
    expandedDetailRows?: Set<string>;
    setExpandedDetailRows?: (
      value: Set<string> | ((prev: Set<string>) => Set<string>),
    ) => void;
  }
}

export function DataTable<
  TData extends {
    id: string;
    id_parent?: string | null;
    level?: number;
    children?: TData[];
  },
  TValue,
>({
  columns,
  table,
  row_click,
  features,
  expandable,
  onExpandRow,
  onHeaderClick,
}: DataTableProps<TData, TValue>) {
  // For tree feature, we'll render children dynamically, not as separate rows
  const getAllVisibleRows = React.useMemo(() => {
    if (!features?.tree) return table.options.data;

    const visibleRows: TData[] = [];
    const expandedRows = table.options.meta?.expandedRows || new Set();

    const addRowsRecursively = (rows: TData[], level = 0) => {
      rows.forEach((row) => {
        // Always add the row itself
        visibleRows.push({ ...row, level });

        // Add children if this row is expanded and has children
        if (
          expandedRows.has(row.id) &&
          row.children &&
          row.children.length > 0
        ) {
          addRowsRecursively(row.children, level + 1);
        }
      });
    };

    addRowsRecursively(table.options.data);
    return visibleRows;
  }, [table.options.data, table.options.meta?.expandedRows, features?.tree]);
  React.useEffect(() => {
    // For tree feature, we don't auto-expand - let user control it
    // Auto-expand is removed to avoid breaking pagination
  }, [features?.tree, table.options.data]);

  const toggleRow = (
    rowId: string,
    rowData: TData,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    const wasExpanded = table.options.meta?.expandedRows?.has(rowId) ?? false;

    table.options.meta?.setExpandedRows?.((prev: Set<string> = new Set()) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
        // Call onExpandRow when expanding (not collapsing)
        if (onExpandRow) {
          onExpandRow(rowId, rowData);
        }
      }
      return next;
    });
  };

  const toggleDetailRow = (rowId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    table.options.meta?.setExpandedDetailRows?.(
      (prev: Set<string> = new Set()) => {
        const next = new Set(prev);
        if (next.has(rowId)) {
          next.delete(rowId);
        } else {
          next.add(rowId);
        }
        return next;
      },
    );
  };

  const isRowExpanded = (rowId: string) =>
    table.options.meta?.expandedRows?.has(rowId) ?? false;

  const isDetailRowExpanded = (rowId: string) =>
    table.options.meta?.expandedDetailRows?.has(rowId) ?? false;

  const shouldRenderRow = (row: { original: TData }) => {
    // For tree feature with nested children, all rows in getAllVisibleRows should render
    return true;
  };

  const hasChildren = (row: TData): boolean | undefined => {
    if (!features?.tree) return false;
    return row?.children && row?.children?.length > 0;
  };

  const getRowLevel = (row: TData): number => {
    return row.level || 0;
  };

  // Add expand column to columns if expandable feature is enabled
  const finalColumns = React.useMemo(() => {
    if (!expandable) return columns;

    const expandColumn: ColumnDef<TData, TValue> = {
      id: "expand",
      header: "",
      size: 50,
      cell: ({ row }) => {
        const isExpanded = isDetailRowExpanded(row.original.id);

        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-transparent"
            onClick={(e) => toggleDetailRow(row.original.id, e)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle details</span>
          </Button>
        );
      },
    };

    return [...columns, expandColumn];
  }, [columns, expandable]);

  return (
    <div className="border-y w-full flex-1 overflow-hidden flex flex-col relative">
      {/* Fixed Header */}
      <TableUI className="w-full flex-shrink-0 relative">
        <TableHeader className=" sticky top-0 bg-background">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => {
                const isFirst = index === 0;
                const isLast = index === headerGroup.headers.length - 1;
                const sortDirection = table
                  .getState()
                  .sorting.find((s) => s.id === header.id)?.desc;
                const isSorted = table
                  .getState()
                  .sorting.some((s) => s.id === header.id);

                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      "capitalize font-medium whitespace-normal text-ellipsis z-[99]",
                      isFirst && "rounded-tl-md",
                      isLast && "rounded-tr-md",
                      onHeaderClick && "cursor-pointer hover:bg-muted/50",
                    )}
                    style={{
                      width: header.getSize(),
                      minWidth: header.column.columnDef.minSize,
                      maxWidth: header.column.columnDef.maxSize,
                    }}
                    onClick={() => {
                      if (onHeaderClick && header.id !== "expand") {
                        onHeaderClick(header.id);
                      }
                    }}
                  >
                    <div className={cn("flex items-center gap-2", features?.tree && header.id === "name" && "pl-8")}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {isSorted && (
                        <div className="ml-1">
                          {sortDirection === undefined ? (
                            <ArrowUp className="h-4 w-4 text-muted-foreground" />
                          ) : sortDirection ? (
                            <ArrowDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ArrowUp className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody className="">
          {/* <ScrollArea className="bg flex-1 w-full"> */}
          {features?.tree ? (
            // For tree feature, use our custom visible rows logic
            getAllVisibleRows.length ? (
              getAllVisibleRows.map((rowData, index) => {
                const level = getRowLevel(rowData);
                const canExpand = hasChildren(rowData);
                const isDetailExpanded = isDetailRowExpanded(rowData.id);

                return (
                  <React.Fragment key={rowData.id}>
                    <TableRow
                      onClick={() => row_click?.(rowData)}
                      className={cn(
                        "border-y cursor-pointer transition-colors hover:bg-muted overflow-y-auto",
                        index % 2 === 1 && "bg-muted",
                      )}
                    >
                      {columns.map((column, cellIndex) => (
                        <TableCell
                          key={`${rowData.id}-${cellIndex}`}
                          className="whitespace-normal text-ellipsis align-top p-3"
                          style={{
                            paddingLeft:
                              cellIndex === 0 && features?.tree
                                ? `${level * 32 + 12}px`
                                : "12px",
                          }}
                        >
                          <div className="flex items-start">
                            {cellIndex === 0 && features?.tree && canExpand && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 w-6 h-6 mr-2 hover:bg-transparent flex-shrink-0"
                                onClick={(e) =>
                                  toggleRow(rowData.id, rowData, e)
                                }
                              >
                                {isRowExpanded(rowData.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {cellIndex === 0 &&
                              features?.tree &&
                              !canExpand &&
                              level > 0 && (
                                <div className="w-6 h-6 mr-2 flex-shrink-0 flex items-center justify-center">
                                  <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            {cellIndex === 0 &&
                              features?.tree &&
                              !canExpand &&
                              level === 0 && (
                                <div className="w-6 h-6 mr-2 flex-shrink-0" />
                              )}
                            {column.cell
                              ? flexRender(column.cell, {
                                  getValue: (columnId?: string) =>
                                    (rowData as any)[
                                      columnId || column.id || ""
                                    ],
                                  row: {
                                    original: rowData,
                                    getValue: (columnId: string) =>
                                      (rowData as any)[columnId],
                                  },
                                  column: {
                                    id: column.id,
                                    columnDef: column,
                                  },
                                  cell: {
                                    getValue: () =>
                                      (rowData as any)[column.id || ""],
                                  },
                                  table: table,
                                } as any)
                              : (rowData as any)[column.id || ""]}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Expanded Detail Row */}
                    {isDetailExpanded && expandable && (
                      <TableRow className="bg-muted/30">
                        <TableCell
                          colSpan={columns.length}
                          className="p-0 border-y"
                        >
                          <div className="">
                            {expandable.renderExpandedContent ? (
                              expandable.renderExpandedContent(rowData)
                            ) : (
                              <div className="text-sm text-muted-foreground p-4">
                                Expanded content for {rowData.id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
            )
          ) : // Original logic for non-tree tables
          table.getRowModel().rows?.length ? (
            table
              .getRowModel()
              .rows.filter(shouldRenderRow)
              .map((row, index) => {
                const level = getRowLevel(row.original);
                const canExpand = hasChildren(row.original);
                const isDetailExpanded = isDetailRowExpanded(row.original.id);

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      onClick={() => row_click?.(row.original)}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "border-y cursor-pointer transition-colors hover:bg-muted overflow-y-auto ",
                        index % 2 === 1 && "bg-muted",
                      )}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => (
                        <TableCell
                          key={cell.id}
                          className=" text-ellipsis align-middle"
                          style={{
                            paddingLeft:
                              cellIndex === 0 && features?.tree
                                ? `${level * 32 + 12}px`
                                : "12px",
                            width: cell.column.getSize() || "100%",
                            minWidth: cell.column.columnDef.minSize,
                            maxWidth: cell.column.columnDef.maxSize,
                          }}
                        >
                          <div className="flex items-start text-start">
                            {cellIndex === 0 && features?.tree && canExpand && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 w-6 h-6 mr-2 hover:bg-transparent flex-shrink-0"
                                onClick={(e) =>
                                  toggleRow(row.original.id, row.original, e)
                                }
                              >
                                {isRowExpanded(row.original.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {cellIndex === 0 &&
                              features?.tree &&
                              !canExpand &&
                              level > 0 && (
                                <div className="w-6 h-6 mr-2 flex-shrink-0 flex items-center justify-center">
                                  <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            {cellIndex === 0 &&
                              features?.tree &&
                              !canExpand &&
                              level === 0 && (
                                <div className="w-6 h-6 mr-2 flex-shrink-0" />
                              )}
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Expanded Detail Row */}
                    {isDetailExpanded && expandable && (
                      <TableRow className="bg-muted/30">
                        <TableCell
                          colSpan={row.getVisibleCells().length}
                          className="p-0 border-y"
                        >
                          <div className="">
                            {expandable.renderExpandedContent ? (
                              expandable.renderExpandedContent(row.original)
                            ) : (
                              <div className="text-sm text-muted-foreground p-4">
                                Expanded content for {row.original.id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
          {/* </ScrollArea> */}
        </TableBody>
      </TableUI>
    </div>
  );
}
