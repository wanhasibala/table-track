"use client";
import * as React from "react";
import { format, formatDate } from "date-fns";
import { DateRange as CalendarDateRange } from "react-day-picker";
import {
  Check,
  ChevronsUpDown,
  Search,
  X,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  AsyncCombobox,
  type AsyncComboboxOption,
} from "@/components/ui/async-combobox";
import { Badge } from "../badge";

interface FilterOption {
  label: string;
  value: string;
}

export type FilterValue =
  | string[]
  | string
  | CalendarDateRange
  | Date
  | number
  | undefined
  | number[]
  | boolean
  | boolean[]
  | null
  | { from: string | undefined; to: string | undefined };

interface FilterProps {
  column: string;
  label: string;
  id_label?: string;
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  type?:
    | "select"
    | "text"
    | "daterange"
    | "date"
    | "combobox"
    | "year"
    | "warehouse"
    | "select-async"
    | "badge";
  options?: FilterOption[];
  loadOptions?: (searchTerm: string) => Promise<AsyncComboboxOption[]>;
  debounceMs?: number;
}

export function TableFilter({
  column,
  label,
  value,
  onChange,
  type = "text",
  options = [],
  loadOptions,
  debounceMs = 300,
}: FilterProps) {
  if (type === "warehouse") {
    // Get current option index
    const currentIndex = options.findIndex((option) => option.value === value);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < options.length - 1 && currentIndex !== -1;

    const handlePrevious = () => {
      if (hasPrevious) {
        const previousOption = options[currentIndex - 1];
        onChange(previousOption.value);
      }
    };

    const handleNext = () => {
      if (hasNext) {
        const nextOption = options[currentIndex + 1];
        onChange(nextOption.value);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <Button
          variant={"ghost"}
          disabled={!hasPrevious}
          onClick={handlePrevious}
        >
          <ChevronLeft />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"ghost"}>
              {value
                ? options.find((option) => option.value === value)?.label
                : label}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Command>
              <CommandInput
                placeholder={`Search ${label.toLowerCase()}...`}
              />
              <CommandEmpty>
                No {label.toLowerCase()} found.
              </CommandEmpty>
              <CommandGroup>
                {options?.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label.toLowerCase()}
                    onSelect={() => {
                      onChange(value === option.value ? "" : option.value);
                      // setOspen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <Button variant={"ghost"} disabled={!hasNext} onClick={handleNext}>
          <ChevronRight />
        </Button>
      </div>
    );
  }
  if (type === "date") {
    return (
      <div className="grid gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"ghost"}>
              <CalendarDays size={16} />
              {formatDate(new Date(), "dd-MM-yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value instanceof Date ? value : undefined}
              onSelect={(date) => onChange(date || undefined)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  if (type === "daterange") {
    const dateRange =
      typeof value === "object"
        ? (value as CalendarDateRange)
        : { from: undefined, to: undefined };
    return (
      <div className="grid gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                " justify-start text-left font-normal h-8",
                !dateRange && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span> {formatDate(new Date(), "dd-MM-yyyy")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              onSelect={(range) =>
                onChange(range || { from: undefined, to: undefined })
              }
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  if (type === "combobox") {
    const [open, setOpen] = React.useState(false);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-8 w-[200px] justify-between"
          >
            {value
              ? options.find((option) => option.value === value)?.label
              : `Select ${label.toLowerCase()}`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder={`Search ${label.toLowerCase()}...`}
            />
            <CommandEmpty>
              No {label.toLowerCase()} found.
            </CommandEmpty>
            <CommandGroup>
              {options?.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label.toLowerCase()}
                  onSelect={() => {
                    onChange(value === option.value ? "" : option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  if (type === "select") {
    return (
      <Select
        value={typeof value === "string" ? value || "all" : "all"}
        onValueChange={(v) => onChange(v)}
      >
        <SelectTrigger className="h-8 w-[200px]">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (type === "badge") {
    return (
      <div className="flex gap-2">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <Badge
              key={option.value}
              variant={isActive ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onChange(isActive ? "" : option.value)}
            >
              {option.label}
            </Badge>
          );
        })}
      </div>
    );
  }

  if (type === "select-async") {
    if (!loadOptions) {
      return <div>Error: loadOptions is required for select-async type</div>;
    }

    return (
      <AsyncCombobox
        loadOptions={loadOptions}
        value={typeof value === "string" ? value : ""}
        onChange={(newValue) => {
          if (typeof newValue === "string") {
            onChange(newValue);
          }
        }}
        placeholder={`Select ${label.toLowerCase()}`}
        multiple={false}
        initialOptions={options}
      />
    );
  }

  // Text input with search icon and clear button
  const [inputValue, setInputValue] = React.useState(
    typeof value === "string" ? value : "",
  );
  const debouncedValue = useDebounce(inputValue, debounceMs);
  const prevValueRef = React.useRef(value);

  // Sync input value when external value prop changes
  React.useEffect(() => {
    if (value !== prevValueRef.current) {
      setInputValue(typeof value === "string" ? value : "");
      prevValueRef.current = value;
    }
  }, [value]);

  // Only call onChange when debounced value differs from previous external value
  React.useEffect(() => {
    if (debouncedValue !== prevValueRef.current) {
      onChange(debouncedValue);
      prevValueRef.current = debouncedValue;
    }
  }, [debouncedValue, onChange]);

  return (
    <div className="relative w-full ">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={`Search ${label.toLowerCase()}...`}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="h-10 pl-8 pr-8 rounded-sm"
      />
      {inputValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
          onClick={() => setInputValue("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export interface FilterConfig {
  column: string;
  label: string;
  type?:
    | "select"
    | "text"
    | "daterange"
    | "date"
    | "combobox"
    | "year"
    | "warehouse"
    | "select-async"
    | "badge";
  onChange?: (value: FilterValue) => void;
  disabled?: false;
  options?: FilterOption[];
  loadOptions?: (searchTerm: string) => Promise<AsyncComboboxOption[]>;
  yearTo?: number;
  multiple?: boolean;
  debounceMs?: number;
}

interface TableFiltersProps {
  filters: { [key: string]: FilterValue };
  config: FilterConfig[];
  onChange: (filters: { [key: string]: FilterValue }) => void;
}

export function TableFilters({ filters, config, onChange }: TableFiltersProps) {
  const handleFilterChange = (column: string, value: FilterValue) => {
    // Find the filter configuration
    const filter = config.find((f) => f.column === column);

    // Call the individual filter's onChange if it exists
    if (filter?.onChange) {
      filter.onChange(value);
    }

    // Call the global onChange
    onChange({
      ...filters,
      [column]: value,
    });
  };

  return (
    <div className="flex items-center gap-2  ">
      {config.map((filter) => (
        <TableFilter
          key={filter.column}
          column={filter.column}
          label={filter.label}
          value={
            filters[filter.column] || (filter.type === "select" ? "all" : "")
          }
          type={filter.type || "text"}
          options={filter.options}
          loadOptions={filter.loadOptions}
          debounceMs={filter.debounceMs}
          onChange={(value) => {
            if (filter.type === "date") {
              handleFilterChange(filter.column, value as Date);
            } else if (filter.type === "daterange") {
              handleFilterChange(filter.column, value as CalendarDateRange);
            } else {
              handleFilterChange(filter.column, value as string);
            }
          }}
        />
      ))}
    </div>
  );
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
