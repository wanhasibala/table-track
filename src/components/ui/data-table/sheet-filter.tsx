"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import {
  Calendar as CalendarIcon,
  Filter as FilterIcon,
  ListFilter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shortDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  AsyncCombobox,
  type AsyncComboboxOption,
} from "@/components/ui/async-combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { type FilterConfig, type FilterValue } from "./filter";
import { useTranslation } from "@/lib/use-translation";
import { EditArrowDownIcon } from "@/components/icons/icons";

interface YearPickerProps {
  value: number | null;
  onChange: (year: number | null) => void;
  fromYear?: number;
  toYear?: number;
}

function YearPicker({
  value,
  onChange,
  fromYear = 1900,
  toYear = new Date().getFullYear(),
}: YearPickerProps) {
  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => fromYear + i,
  ).reverse();

  return (
    <Select
      value={value ? value.toString() : undefined}
      onValueChange={(val) => onChange(val ? parseInt(val) : null)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select year" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto">
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface SheetFilterProps {
  filters: { [key: string]: FilterValue };
  config: FilterConfig[];
  onChange: (filters: { [key: string]: FilterValue }) => void;
}

export function SheetFilter({ filters, config, onChange }: SheetFilterProps) {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = React.useState(filters);
  const [popoverOpen, setPopoverOpen] = React.useState<{
    [key: string]: boolean;
  }>({});

  // Reset local filters when sheet opens, don't sync on every filters change
  // React.useEffect(() => {
  //   if (open) {
  //     setLocalFilters(filters);
  //   }
  // }, [open]);

  const handleFilterChange = React.useCallback(
    (column: string, value: FilterValue) => {
      const processedValue =
        value instanceof Date && !isNaN(value.getTime())
          ? new Date(value)
          : value;

      setLocalFilters((prev) => ({
        ...prev,
        [column]: processedValue,
      }));
    },
    []
  );

  const handlePopoverOpen = React.useCallback(
    (column: string, open: boolean) => {
      setPopoverOpen((prev) => ({ ...prev, [column]: open }));
    },
    []
  );

  const handleApply = React.useCallback(() => {
    onChange(localFilters);
    setOpen(false);
    setPopoverOpen({});
  }, [localFilters, onChange]);

  const createAsyncComboboxonChange = React.useCallback(
    (column: string) => (value: string | string[]) => {
      if (Array.isArray(value)) {
        handleFilterChange(column, value[0] || "");
      } else {
        handleFilterChange(column, value);
      }
    },
    [handleFilterChange]
  );

  const createSelectOnChange = React.useCallback(
    (column: string) => (value: string) => {
      handleFilterChange(column, value);
    },
    [handleFilterChange]
  );

  const createDateOnSelect = React.useCallback(
    (column: string) => (date: Date | undefined) => {
      handleFilterChange(column, date);
    },
    [handleFilterChange]
  );

  const createComboboxOnChange = React.useCallback(
    (column: string) => (value: string | string[]) => {
      handleFilterChange(column, value);
    },
    [handleFilterChange]
  );

  const createInputOnChange = React.useCallback(
    (column: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilterChange(column, e.target.value);
    },
    [handleFilterChange]
  );

  const activeFiltersCount = config.reduce((count, filter) => {
    const value = filters[filter.column];
    if (filter.type === "select" || filter.type === "combobox") {
      return value && value !== "all" ? count + 1 : count;
    }
    if (filter.type === "date" || filter.type === "year") {
      return value ? count + 1 : count;
    }
    if (filter.type === "daterange") {
      if (
        value &&
        typeof value === "object" &&
        "from" in value &&
        ((value as DateRange).from || (value as DateRange).to)
      ) {
        return count + 1;
      }
      return count;
    }
    return value ? count + 1 : count;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger asChild>
        <Button variant="outline"  className="h-8 border-dashed">
          <ListFilter />
          {activeFiltersCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="px-4">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          {config.map((filter) => (
            <div key={filter.column} className="w-full">
              <label className="text-sm font-medium w-full">
                {filter.label}
              </label>

              {filter.type === "date" ? (
                <div className="grid gap-2">
                  <Popover
                    open={popoverOpen[filter.column]}
                    onOpenChange={(open) =>
                      handlePopoverOpen(filter.column, open)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        disabled={filter.disabled}
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters[filter.column] &&
                            "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters[filter.column] instanceof Date ? (
                          shortDate(localFilters[filter.column] as Date)
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          localFilters[filter.column] instanceof Date
                            ? (localFilters[filter.column] as Date)
                            : undefined
                        }
                        onSelect={createDateOnSelect(filter.column)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ) : filter.type === "year" ? (
                <YearPicker
                  value={
                    typeof localFilters[filter.column] === "number"
                      ? (localFilters[filter.column] as number)
                      : null
                  }
                  toYear={filter.yearTo || new Date().getFullYear()}
                  onChange={(year) => handleFilterChange(filter.column, year)}
                />
              ) : filter.type === "daterange" ? (
                <div className="grid gap-2">
                  <Popover
                    open={popoverOpen[filter.column]}
                    onOpenChange={(open) =>
                      handlePopoverOpen(filter.column, open)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        disabled={filter.disabled}
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !((localFilters[filter.column] as DateRange)?.from ||
                            (localFilters[filter.column] as DateRange)?.to) &&
                            "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {(localFilters[filter.column] as DateRange)?.from ? (
                          (localFilters[filter.column] as DateRange)?.to ? (
                            <>
                              {shortDate(
                                (localFilters[filter.column] as DateRange).from!,
                              )}{" "}
                              -{" "}
                              {shortDate(
                                (localFilters[filter.column] as DateRange).to!,
                              )}
                            </>
                          ) : (
                            shortDate(
                              (localFilters[filter.column] as DateRange).from!,
                            )
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={
                          localFilters[filter.column] instanceof Object &&
                          "from" in (localFilters[filter.column] as object)
                            ? (localFilters[filter.column] as DateRange)
                            : undefined
                        }
                        onSelect={(range) => {
                          handleFilterChange(filter.column, range);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ) : filter.type === "combobox" ? (
                <Combobox
                  options={
                    filter.options?.map((option) => ({
                      label: option.label,
                      value: option.value,
                    })) || []
                  }
                  disabled={filter.disabled}
                  value={
                    filter.multiple
                      ? Array.isArray(localFilters[filter.column])
                        ? (localFilters[filter.column] as string[])
                        : localFilters[filter.column]
                          ? [localFilters[filter.column] as string]
                          : []
                      : typeof localFilters[filter.column] === "string"
                        ? (localFilters[filter.column] as string)
                        : ""
                  }
                  onChange={createComboboxOnChange(filter.column)}
                  placeholder={`Select ${filter.label.toLowerCase()}`}
                  multiple={filter.multiple || false}
                  className="w-full mt-1"
                />
              ) : filter.type === "select-async" ? (
                filter.loadOptions ? (
                  <AsyncCombobox
                    loadOptions={filter.loadOptions}
                    value={
                      typeof localFilters[filter.column] === "string"
                        ? (localFilters[filter.column] as string)
                        : ""
                    }
                    onChange={createAsyncComboboxonChange(filter.column)}
                    placeholder={`Select ${filter.label.toLowerCase()}`}
                    multiple={false}
                    disabled={filter.disabled}
                    initialOptions={filter.options}
                  />
                ) : (
                  <div className="text-sm text-destructive">
                    Error: loadOptions is required
                  </div>
                )
              ) : filter.type === "select" ? (
                <Select
                  value={
                    typeof localFilters[filter.column] === "string"
                      ? (localFilters[filter.column] as string)
                      : "all"
                  }
                  disabled={filter.disabled}
                  onValueChange={createSelectOnChange(filter.column)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={`Select ${filter.label.toLowerCase()}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder={`Filter by ${filter.label.toLowerCase()}`}
                  value={
                    typeof localFilters[filter.column] === "string"
                      ? (localFilters[filter.column] as string)
                      : ""
                  }
                  onChange={createInputOnChange(filter.column)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleApply}>
            {" "}
            {t("table.sheet_filter.apply")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const resetFilters = config.reduce(
                (acc, filter) => ({
                  ...acc,
                  [filter.column]:
                    filter.type === "select" ||
                    filter.type === "combobox" ||
                    filter.type === "select-async"
                      ? ""
                      : filter.type === "daterange"
                        ? { from: undefined, to: undefined }
                        : filter.type === "date" || filter.type === "year"
                          ? undefined
                          : "",
                }),
                {},
              );
              setLocalFilters(resetFilters);
              onChange(resetFilters);
              setOpen(false);
              setPopoverOpen({});
            }}
          >
            {t("table.sheet_filter.reset")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
