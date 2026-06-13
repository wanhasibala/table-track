"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  X,
  CornerDownRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface AsyncComboboxOption {
  value: string;
  label: string;
  children?: AsyncComboboxOption[];
  isParent?: boolean;
}

export interface AsyncComboboxProps {
  loadOptions: (searchTerm: string) => Promise<AsyncComboboxOption[]>;
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
  showSelectAll?: boolean;
  enableTree?: boolean;
  debounceMs?: number;
  initialOptions?: AsyncComboboxOption[];
}

export function AsyncCombobox({
  loadOptions,
  value,
  onChange,
  placeholder = "Select option",
  className,
  multiple = false,
  disabled,
  showSelectAll = true,
  enableTree = true,
  debounceMs = 300,
  initialOptions = [],
}: AsyncComboboxProps) {
  const isDisabled = disabled === true;
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [options, setOptions] =
    React.useState<AsyncComboboxOption[]>(initialOptions);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = React.useState<
    AsyncComboboxOption[]
  >([]);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Store loadOptions in a ref to avoid dependency issues
  const loadOptionsRef = React.useRef(loadOptions);
  React.useEffect(() => {
    loadOptionsRef.current = loadOptions;
  }, [loadOptions]);

  // Load options when search term changes
  React.useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await loadOptionsRef.current(debouncedSearchTerm);
        setOptions(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load options");
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [debouncedSearchTerm]);

  // Flatten options for easy lookup
  const flattenedOptions = React.useMemo(() => {
    const flattened: AsyncComboboxOption[] = [];
    const flatten = (opts: AsyncComboboxOption[]) => {
      opts.forEach((opt) => {
        flattened.push(opt);
        if (opt.children && opt.children.length > 0) {
          flatten(opt.children);
        }
      });
    };
    flatten(options);
    return flattened;
  }, [options]);

  // Update selected options state when value changes
  React.useEffect(() => {
    if (multiple && Array.isArray(value)) {
      const newSelected = value
        .map((v) => flattenedOptions.find((opt) => opt.value === v))
        .filter((opt) => opt !== undefined) as AsyncComboboxOption[];
      setSelectedOptions(newSelected);
    } else if (!multiple && value && typeof value === "string") {
      const found = flattenedOptions.find((opt) => opt.value === value);
      setSelectedOptions(found ? [found] : []);
    } else {
      setSelectedOptions([]);
    }
  }, [value, flattenedOptions, multiple]);

  const selectedLabels = React.useMemo(() => {
    return selectedOptions.map((opt) => opt.label);
  }, [selectedOptions]);

  // Check if all options are selected
  const allSelected = React.useMemo(() => {
    if (!multiple || !Array.isArray(value)) return false;
    const leafOptions = flattenedOptions.filter(
      (opt) => !opt.children || opt.children.length === 0,
    );
    return leafOptions.every((option) => value.includes(option.value));
  }, [value, flattenedOptions, multiple]);

  // Check if some options are selected (for indeterminate state)
  const someSelected = React.useMemo(() => {
    if (!multiple || !Array.isArray(value) || value.length === 0) return false;
    return !allSelected;
  }, [value, allSelected, multiple]);

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "") {
      // Clear selection
      onChange(multiple ? [] : "");
      if (!multiple) setOpen(false);
      return;
    }

    if (multiple && Array.isArray(value)) {
      const newValue = value.includes(selectedValue)
        ? value.filter((v) => v !== selectedValue)
        : [...value, selectedValue];
      onChange(newValue);
    } else {
      onChange(selectedValue);
      setOpen(false);
    }
  };

  const handleSelectAll = () => {
    if (!multiple) return;

    const leafOptions = flattenedOptions.filter(
      (opt) => !opt.children || opt.children.length === 0,
    );

    if (allSelected) {
      onChange([]);
    } else {
      onChange(leafOptions.map((opt) => opt.value));
    }
  };

  const handleRemove = (valueToRemove: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((v) => v !== valueToRemove));
    } else {
      onChange("");
    }
  };

  const renderOptions = (opts: AsyncComboboxOption[], level = 0) => {
    return opts.map((option) => {
      if (!option || !option.value) return null;
      
      const isSelected = multiple
        ? Array.isArray(value) && value.includes(option.value)
        : value === option.value;

      const hasChildren =
        enableTree && option.children && option.children.length > 0;

      return (
        <React.Fragment key={option.value}>
          <CommandItem
            value={option.value}
            onSelect={() => {
              if (!option.isParent) {
                handleSelect(option.value);
              }
            }}
            className={cn(
              option.isParent && "font-semibold text-muted-foreground",
              !option.isParent && "cursor-pointer",
              "w-full flex justify-between items-center",
            )}
            disabled={Boolean(option.isParent)}
          >
            <div
              className="flex items-center gap-2 flex-1"
              style={{
                paddingLeft: enableTree ? `${level * 1.5}px` : undefined,
              }}
            >
              {level > 0 && enableTree && (
                <CornerDownRight className="h-3 w-3 text-muted-foreground" />
              )}

              <span className={option.isParent ? "text-xs uppercase" : ""}>
                {option.label}
              </span>
            </div>
            {multiple && !option.isParent && (
              <div
                className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50 [&_svg]:invisible",
                )}
              >
                <Check className={cn("h-4 w-4")} />
              </div>
            )}
            {!multiple && !option.isParent && (
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  isSelected ? "opacity-100" : "opacity-0",
                )}
              />
            )}
          </CommandItem>
          {hasChildren && renderOptions(option.children!, level + 1)}
        </React.Fragment>
      );
    });
  };

  const organizeOptions = () => {
    const emptyOption: AsyncComboboxOption = {
      value: "",
      label: "Clear selection",
    };

    const selectedSet = new Set(
      multiple && Array.isArray(value) ? value : value ? [value] : [],
    );

    const notSelected = flattenedOptions.filter(
      (opt) => !selectedSet.has(opt.value) && !opt.isParent,
    );
    const selected = selectedOptions.filter((opt) => !opt.isParent);

    return [emptyOption, ...selected, ...notSelected];
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="w-full h-fit py-2">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
          disabled={isDisabled}
        >
          <div className="flex gap-1 flex-wrap flex-1 mr-2 h-fit">
            {multiple && Array.isArray(value) && value.length > 0 ? (
              selectedLabels.map((label, index) => (
                <Badge
                  variant="secondary"
                  key={index}
                  className="mr-1 mb-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(Array.isArray(value) ? value[index] : value);
                  }}
                >
                  {label}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRemove(
                          Array.isArray(value) ? value[index] : value,
                        );
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(Array.isArray(value) ? value[index] : value);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : value && !multiple ? (
              <span className="truncate">{selectedLabels[0]}</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[300px]">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandEmpty>
            {/* {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading...</span>
              </div>
            ) : error ? (
              <div className="py-6 text-center text-sm text-destructive">
                {error}
              </div>
            ) : (
              )} */}
              No results found.
          </CommandEmpty>
          <ScrollArea className="max-h-[200px] overflow-y-scroll">
            <CommandGroup>
              {multiple && showSelectAll && flattenedOptions.length > 0 && (
                <CommandItem
                  onSelect={handleSelectAll}
                  className="font-semibold cursor-pointer"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      allSelected
                        ? "bg-primary text-primary-foreground"
                        : someSelected
                          ? "bg-primary/50 text-primary-foreground"
                          : "opacity-50",
                    )}
                  >
                    {(allSelected || someSelected) && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                  Select All
                </CommandItem>
              )}
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading...</span>
                </div>
              ) : (
                renderOptions(organizeOptions())
              )}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
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
