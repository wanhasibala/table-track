"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { shortDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangeFilterProps {
  label: string;
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
}

export function DateRangeFilter({
  label,
  value,
  onChange,
}: DateRangeFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}{" "}
          {value?.from && (
            <>
              :{" "}
              <span className="ml-1 font-medium">
                {shortDate(value.from)}
                {value.to ? ` - ${shortDate(value.to)}` : ""}
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto p-2" align="start">
        <div className="flex flex-col space-y-2 p-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />{" "}
                {value?.from ? (
                  value.to ? (
                    <>
                      {shortDate(value.from)} - {shortDate(value.to)}
                    </>
                  ) : (
                    shortDate(value.from)
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={onChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {value && (
            <Button
              variant="ghost"
              className="justify-start text-red-600 hover:text-red-700 hover:bg-red-100"
              onClick={() => onChange(undefined)}
            >
              Clear dates
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
