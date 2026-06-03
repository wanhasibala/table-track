"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/use-translation";
interface DataTablePaginationProps {
  currentPage: number;
  pageCount: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}


export function DataTablePagination({
  currentPage,
  pageCount,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}: DataTablePaginationProps) {
  const { t } = useTranslation();

const perPageOptions = [
  { value: "5", label: `5 ${t("table.pagination.per_page")}` },
  { value: "10", label: `10 ${t("table.pagination.per_page")}` },
  { value: "20", label: `20 ${t("table.pagination.per_page")}` },
  { value: "50", label: `50 ${t("table.pagination.per_page")}` },
  { value: "100", label: `100 ${t("table.pagination.per_page")}` },
];
  return (
    <div className="flex items-center justify-between px-2 py-4 border-t flex-shrink-0 bg-background">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
         {total} {t("table.pagination.total_items")}
        </span>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            {t("table.pagination.rows")}
          </p>
          <Select
            value={perPage.toString()}
            onValueChange={(value) => onPerPageChange(Number(value))}
          >
            <SelectTrigger className="h-8 ">
              <SelectValue placeholder={perPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {perPageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          {t("table.pagination.page")} {currentPage}{" "}
          {t("table.pagination.of")} {pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">{t("table.pagination.previous")}</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">{t("table.pagination.previous")}</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
          >
            <span className="sr-only">{t("table.pagination.next")}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(pageCount)}
            disabled={currentPage === pageCount}
          >
            <span className="sr-only">{t("table.pagination.last")}</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
