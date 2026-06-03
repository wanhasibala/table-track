"use client"

import { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface DataTableToolbarProps<TData> {
  table: Table<TData>
  filterColumn?: string
}

export function DataTableToolbar<TData>({
  table,
  filterColumn,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  
  // Get the first filterable column if no filterColumn is specified
  const filterableColumn = filterColumn 
    ? table.getColumn(filterColumn)
    : table.getAllColumns().find(column => column.getCanFilter())

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {filterableColumn && (
          <Input
            placeholder={`Filter ${filterableColumn.id}...`}
            value={(filterableColumn.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              filterableColumn.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter(
              (column) => typeof column.accessorFn !== "undefined" && column.getCanHide()
            )
            .map((column) => {
              const columnId = column.id || "column"
              return (
                <DropdownMenuCheckboxItem
                  key={columnId}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              )
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}