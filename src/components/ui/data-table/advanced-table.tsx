"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingFn,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Funnel,
  Plus,
  RefreshCcw,
  ChevronUp,
  ChevronDown,
  LucideIcon,
  Settings,
  Filter,
  Download,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { DataTable } from "./data-table";
import { DataTablePagination } from "./pagination";
import { TableFilters, type FilterConfig, type FilterValue } from "./filter";
import { SheetFilter } from "./sheet-filter";
import { type DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Separator } from "../separator";
import Sorting from "./sorting";
import { ProcessButtonComponent } from "./process-button";
import { useTranslation } from "@/lib/use-translation";
import { usePermissions } from "@/hooks/use-permissions";

interface Pagination {
  page: number;
  max_page: number;
  per_page: number;
  total: number;
}

export interface SortButtonConfig<TData> {
  column: keyof TData;
  label: string;
  onClick: () => void;
  sortState?: "asc" | "desc" | "none";
  ascendingIcon?:
    | LucideIcon
    | string
    | React.ComponentType<{ className?: string }>
    | React.ReactNode;
  descendingIcon?:
    | LucideIcon
    | string
    | React.ComponentType<{ className?: string }>
    | React.ReactNode;
}

export interface ProcessButton {
  label: string;
  onClick: () => void;
  icon?: LucideIcon | string;
  disabled?: boolean;
  hide?: boolean;
  variant?: "default" | "destructive" | "outline";
  className?: string;
}

interface AdvancedTableProps<TData extends { id: string }> {
  meta?: Record<string, any>;
  columns: ColumnDef<TData>[];
  data: TData[];
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  features?: {
    tree?: boolean;
    parent?: keyof TData;
  };
  addButton?: {
    onClick: () => void;
    text?: string;
    permission?: string;
    icon?: LucideIcon | string;
  };
  filterConfig?: FilterConfig[];
  sheetFilterConfig?: FilterConfig[];
  sheetFilterChange?: (filters: { [key: string]: FilterValue }) => void;
  filters?: { [key: string]: FilterValue };
  onFiltersChange?: (filters: { [key: string]: FilterValue }) => void;
  dateRangeFilter?: {
    label: string;
    startField: keyof TData;
    endField?: keyof TData;
    value?: DateRange;
    onChange: (range: DateRange | undefined) => void;
  };
  processButton?: ProcessButton[];
  useSheetFilter?: boolean;
  sortButtons?: SortButtonConfig<TData>[];
  onSortingChange?: (sorting: SortingState) => void;
  row_click?: (id?: string, row?: TData) => void;
  className?: string;
  customLabel?: string;
  customButtons?: {
    text: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: "default" | "destructive" | "outline";
    className?: string;
  }[];
  syncButton?: {
    onClick: () => void;
    text: string;
    permission?: string;
  };
  nestedTable?: {
    getNestedData: (parentData: TData) => any[];
    columns: ColumnDef<any>[];
    nestedTableProps?: Partial<AdvancedTableProps<any>>;
  };
  renderExpandedContent?: (data: TData) => React.ReactNode;
  onExpandRow?: (rowId: string, rowData: TData) => void | Promise<void>;
  view?: "table" | "list";
  onViewChange?: (view: "table" | "list") => void;
  listRender?: (data: TData) => React.ReactNode;
}

// Helper component to render icons properly
export const IconRenderer: React.FC<{
  icon?:
    | LucideIcon
    | string
    | React.ComponentType<{ className?: string }>
    | React.ReactNode;
  className?: string;
}> = ({ icon, className }) => {
  if (!icon) return null;

  if (typeof icon === "string") {
    return <span className={className}>{icon}</span>;
  }

  if (React.isValidElement(icon)) {
    return React.cloneElement(
      icon as React.ReactElement<any>,
      {
        className: cn((icon as any).props?.className, className),
      } as any,
    );
  }

  if (typeof icon === "function" || typeof icon === "object") {
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className={className} />;
  }

  return null;
};

export function AdvancedTable<
  TData extends { id: string; children?: TData[] },
>({
  columns,
  data,
  pagination,
  onPageChange,
  onPerPageChange,
  features,
  addButton,
  filterConfig,
  sheetFilterConfig,
  filters,
  onFiltersChange,
  sheetFilterChange,
  dateRangeFilter,
  useSheetFilter = false,
  sortButtons,
  onSortingChange,
  row_click,
  meta,
  className = "",
  customButtons,
  customLabel,
  syncButton,
  processButton,
  nestedTable,
  renderExpandedContent,
  onExpandRow,
  view: viewProp,
  onViewChange,
  listRender,
}: AdvancedTableProps<TData>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(
    new Set(),
  );
  const [expandedDetailRows, setExpandedDetailRows] = React.useState<
    Set<string>
  >(new Set());
  const [internalView, setInternalView] = React.useState<"table" | "list">("table");
  const view = viewProp ?? internalView;
  const setView = React.useCallback((newView: "table" | "list") => {
    setInternalView(newView);
    onViewChange?.(newView);
  }, [onViewChange]);
  // Handle page change through filters
  const handlePageChange = React.useCallback(
    (page: number) => {
      if (onFiltersChange) {
        const updatedFilters = {
          ...filters,
          page: page,
        };
        onFiltersChange(updatedFilters);
      }
      onPageChange?.(page);
    },
    [onFiltersChange, filters, onPageChange],
  );
  const { t } = useTranslation();

  // Handle per page change through filters
  const handlePerPageChange = React.useCallback(
    (perPage: number) => {
      if (onFiltersChange) {
        const updatedFilters = {
          ...filters,
          per_page: perPage,
          page: 1,
        };
        onFiltersChange(updatedFilters);
      }
      onPerPageChange?.(perPage);
    },
    [onFiltersChange, filters, onPerPageChange],
  );

  // Transform data into tree structure if tree feature is enabled
  const processedData = React.useMemo(() => {
    if (features?.tree && features.parent) {
      const itemMap = new Map<string, TData & { level?: number }>();

      data.forEach((item) => {
        let level = 0;
        let currentId = String(item[features.parent as keyof TData]);
        while (currentId) {
          level++;
          const parentItem = data.find((d) => d.id === currentId);
          if (!parentItem) break;
          currentId = String(parentItem[features.parent as keyof TData]);
        }
        itemMap.set(item.id, { ...item, level });
      });

      return data.map((item) => ({
        ...item,
        level: itemMap.get(item.id)?.level || 0,
      }));
    }
    return data;
  }, [data, features]);

  // Apply filters to table data
  const filteredData = React.useMemo(() => {
    let result = processedData;

    if (dateRangeFilter?.value?.from) {
      result = result.filter((item) => {
        const startDate = new Date(
          item[dateRangeFilter.startField] as unknown as string,
        );
        const endDate = dateRangeFilter.endField
          ? new Date(item[dateRangeFilter.endField] as unknown as string)
          : startDate;

        const filterStart = dateRangeFilter.value?.from;
        const filterEnd = dateRangeFilter.value?.to || filterStart;

        if (!filterStart) return true;

        const startInRange = startDate >= filterStart;
        const endInRange = !filterEnd || endDate <= filterEnd;

        return startInRange && endInRange;
      });
    }

    return result;
  }, [processedData, dateRangeFilter]);

  const handleSetExpandedRows = React.useCallback(
    (value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      if (typeof value === "function") {
        setExpandedRows((prev) => value(prev));
      } else {
        setExpandedRows(value);
      }
    },
    [],
  );
  const handleSortingChange = React.useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(newSorting);

      // Build sort_by from the new sorting state
      let sortByValue = "";
      if (newSorting.length > 0) {
        const primarySort = newSorting[0];
        sortByValue = primarySort.desc ? `-${primarySort.id}` : primarySort.id;
      }

      if (onFiltersChange) {
        if (sortByValue) {
          const updatedFilters = {
            ...filters,
            sort_by: sortByValue,
          };
          onFiltersChange(updatedFilters);
        } else {
          const { sort_by, ...restFilters } = filters || {};
          onFiltersChange(restFilters);
        }
      }

      onSortingChange?.(newSorting);
    },
    [sorting, onFiltersChange, filters, onSortingChange],
  );

  const table = useReactTable({
    meta: {
      ...meta,
      expandedRows,
      setExpandedRows: handleSetExpandedRows,
      expandedDetailRows,
      setExpandedDetailRows,
    },
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    enableMultiSort: true,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Handle header click for sorting
  const handleHeaderClick = React.useCallback(
    (columnId: string) => {
      // Get current sorting state
      const currentSorting = table.getState().sorting;
      const existingSort = currentSorting.find((s) => s.id === columnId);

      let newSorting: SortingState;

      if (!existingSort) {
        // Column not sorted, start with ascending
        newSorting = [{ id: columnId, desc: false }];
      } else if (!existingSort.desc) {
        // Currently ascending, switch to descending
        newSorting = [{ id: columnId, desc: true }];
      } else {
        // Currently descending, remove sort
        newSorting = [];
      }

      handleSortingChange(newSorting);
    },
    [table.getState().sorting, handleSortingChange],
  );

  // Handle sorting change from table
  

  const hasPermissions = usePermissions();
  const hasSorting = sortButtons;
  const hasFiltering =
    useSheetFilter && filterConfig && filters && onFiltersChange;

  const showPopover = hasSorting || hasFiltering;

  return (
    <div
      className={cn(
        className,
        "border flex flex-col rounded-sm w-full h-full overflow-hidden",
      )}
    >
      {(addButton ||
        filterConfig ||
        dateRangeFilter ||
        customButtons ||
        customLabel ||
        sortButtons ||
        processButton ||
        syncButton ||
        true) && (
        <div className="flex items-center justify-between gap-2 bg-background/50 px-2 rounded-md py-2 flex-shrink-0">
          {/* Filters Section */}
          <div className="flex items-center gap-2 flex-1">
            {filterConfig && filters && onFiltersChange && (
              <div className="flex-1 max-w-1/2 gap-2 flex flex-row items-center">
                <TableFilters
                  filters={filters}
                  config={filterConfig}
                  onChange={onFiltersChange}
                />

                <SheetFilter
                  filters={filters!}
                  config={sheetFilterConfig || []}
                  onChange={onFiltersChange!}
                />
                {/* {processButton && processButton?.length > 0 && (
                  <ProcessButtonComponent processButton={processButton} />
                )} */}
              </div>
            )}
          </div>

          {/* Buttons Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Switcher */}
            <div className="flex items-center border rounded-md p-0.5 bg-muted/20">
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="sm"
                className={cn("h-7 px-2.5", view === "table" && "bg-background shadow-sm")}
                onClick={() => setView("table")}
              >
                <TableIcon className="h-4 w-4 mr-1.5" />
                <span className="text-xs">Table</span>
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                className={cn("h-7 px-2.5", view === "list" && "bg-background shadow-sm")}
                onClick={() => setView("list")}
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                <span className="text-xs">List</span>
              </Button>
            </div>

            {customLabel && (
              <span className="text-sm font-medium text-muted-foreground mr-2">
                {customLabel}
              </span>
            )}

            {/* Sync Button */}
            {syncButton &&
              (!syncButton.permission ||
                hasPermissions.hasPermission(syncButton.permission)) && (
                <Button
                  onClick={syncButton.onClick}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {syncButton.text}
                </Button>
              )}

            {/* Custom Buttons */}
            {customButtons?.map((button, index) => (
              <Button
                key={index}
                onClick={button.onClick}
                variant={button.variant || "default"}
                size="sm"
                className={button.className}
              >
                {button.icon && <button.icon className="mr-2 h-4 w-4" />}
                {button?.text}
              </Button>
            ))}

            {/* Add Button */}
            {addButton &&
              (!addButton.permission ||
                hasPermissions.hasPermission(addButton.permission)) && (
                <Button onClick={addButton.onClick} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {addButton?.text || t("table.add_button")}
                </Button>
              )}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="flex flex-col bg-background rounded-md w-full flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredData}
          table={table}
          row_click={row_click ? (row) => row_click(row.id, row) : undefined}
          features={
            features?.tree && features.parent
              ? { tree: true, id_parent: String(features.parent) }
              : undefined
          }
          expandable={
            nestedTable || renderExpandedContent
              ? {
                  getNestedData: nestedTable?.getNestedData,
                  nestedColumns: nestedTable?.columns,
                  renderExpandedContent: renderExpandedContent,
                }
              : undefined
          }
          onExpandRow={onExpandRow}
          onHeaderClick={handleHeaderClick}
          view={view}
          listRender={listRender}
        />

        {pagination && onFiltersChange && (
          <DataTablePagination
            currentPage={pagination.page}
            pageCount={pagination.max_page}
            perPage={pagination.per_page}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
          />
        )}
      </div>
    </div>
  );
}
