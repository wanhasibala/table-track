"use client"

import { type ColumnDef, type Table } from "@tanstack/react-table"

export { DataTable } from "./data-table"

// Re-export the column header component
export { DataTableColumnHeader } from "./components/column-header"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  table: Table<TData>
}

// Example data and columns for reference
export { columns as exampleColumns, type ExampleData } from "./columns.example"