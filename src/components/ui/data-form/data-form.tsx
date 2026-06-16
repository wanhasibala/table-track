/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { AsyncCombobox } from "@/components/ui/async-combobox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Eye, EyeOff, FilePlus, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  LucideIcon,
  Plus,
  Trash2,
  Paperclip,
} from "lucide-react";
import { ScrollArea } from "../scroll-area";
import { shortDate } from "@/lib/date";
import { HTMLProps } from "react";
import { type DateRange } from "react-day-picker";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "select-async"
  | "textarea"
  | "hidden"
  | "table"
  | "radio"
  | "checkbox"
  | "password"
  | "file"
  | "attachment"
  | "rupiah"
  | "icon"
  | "dimensions"
  | "button"
  | "separator"
  | "month"
  | "daterange"
  | "image";

export type FieldWidth =
  | "full"
  | "1/2"
  | "1/3"
  | "1/4"
  | "2/3"
  | "3/4"
  | "auto"
  | string;
export type ButtonFieldConfig = BaseFieldConfig & {
  type: "button";
  onClick: (data: any) => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null
    | undefined;
  size?:
    | "icon"
    | "sm"
    | "lg"
    | "default"
    | "icon-sm"
    | "icon-lg"
    | null
    | undefined;
  width?: FieldWidth;
  icon?: LucideIcon | React.ComponentType<any>;
  className?: HTMLProps<HTMLElement>["className"];
};
export type DimensionsFieldConfig = BaseFieldConfig & {
  type: "dimensions";
  dimensions: {
    x: {
      label: string;
      placeholder?: string;
      validation?: {
        required?: boolean;
        min?: number;
        max?: number;
      };
    };
    y: {
      label: string;
      placeholder?: string;
      validation?: {
        required?: boolean;
        min?: number;
        max?: number;
      };
    };
    z: {
      label: string;
      placeholder?: string;
      validation?: {
        required?: boolean;
        min?: number;
        max?: number;
      };
    };
  };
  unit?: string; // Single unit for all dimensions (e.g., "CM")
  showDimensionDisplay?: boolean; // Show the "16 × 20 × 2 CM" display
};

export interface SelectConfig {
  label: string;
  value: string;
  children?: SelectConfig[];
  isParent?: boolean;
}

type BaseFieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  prefix?: string | React.ReactNode; // Prefix to display in the input
  includePrefix?: boolean; // Whether to include prefix in the submitted value
  hide?: boolean | ((values: any) => boolean);
  width?: string;
  disabled?: boolean;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string; // Custom error message for pattern validation
    custom?: (value: any, formData: any) => string | undefined;
    regex?: {
      // Predefined regex patterns
      email?: boolean;
      url?: boolean;
      alphanumeric?: boolean;
      numeric?: boolean;
      phone?: boolean;
    };
    dateRange?: {
      min?: string;
      max?: string;
      notBefore?: string;
      notAfter?: string;
      compareField?: string;
    };
  };
  onChange?: (
    value: any,
    form: UseFormReturn<Record<string, unknown>, any, Record<string, unknown>>,
  ) => void;
};

export type FieldConfig =
  | SelectFieldConfig
  | SelectAsyncFieldConfig
  | RadioFieldConfig
  | TableFieldConfig
  | CheckboxFieldConfig
  | FileFieldConfig
  | AttachmentFieldConfig
  | IconFieldConfig
  | DimensionsFieldConfig
  | ButtonFieldConfig
  | DateRangeFieldConfig
  | ImageFieldConfig
  | ImagesFieldConfig
  | (BaseFieldConfig & {
      type: Exclude<
        FieldType,
        | "select"
        | "select-async"
        | "radio"
        | "table"
        | "checkbox"
        | "file"
        | "attachment"
        | "icon"
        | "dimensions"
        | "daterange"
        | "button"
        | "image"
        | "images"
      >;
    });

export type TableColumnConfig = {
  label: string;
  value: string;
  type?:
    | "text"
    | "number"
    | "date"
    | "month"
    | "select"
    | "select-async"
    | "textarea"
    | "checkbox"
    | "file";
  options?: SelectConfig[];
  onChange?: (
    value: any,
    rowIndex: number,
    updateRow: (updates: any) => void,
  ) => void;
  disabled?: boolean;
  loadOptions?: (searchTerm: string) => Promise<SelectConfig[]>;
  debounceMs?: number;
  multiple?: boolean;
  accept?: string;
  savedFiles?: string | Array<{ name: string; url: string }>;
  validation?: {
    required?: boolean;
    dateRange?: {
      notBefore?: string;
      max?: string;
      min?: string;
      notAfter?: string;
    };
  };
};
type CheckboxFieldConfig = BaseFieldConfig & {
  type: "checkbox";
  customInput?: boolean;
  checkedValue?: any; // Optional custom value when checked
  uncheckedValue?: any; // Optional custom value when unchecked
};

type TableFieldConfig = BaseFieldConfig & {
  type: "table";
  columns?: TableColumnConfig[];
  data?: any[];
};

type RadioFieldConfig = BaseFieldConfig & {
  type: "radio";
  options: (SelectConfig & { customInput?: boolean })[];
  direction?: "row" | "col";
};

type SelectFieldConfig = BaseFieldConfig & {
  type: "select";
  options: SelectConfig[];
  multiple?: boolean;
  enableTree?: boolean;
  onChange?: (value: any, form: any) => void;
};

type SelectAsyncFieldConfig = BaseFieldConfig & {
  type: "select-async";
  loadOptions: (searchTerm: string) => Promise<SelectConfig[]>;
  multiple?: boolean;
  enableTree?: boolean;
  debounceMs?: number;
  initialOptions?: SelectConfig[];
  onChange?: (value: any, form: any) => void;
};
type IconFieldConfig = BaseFieldConfig & {
  type: "icon";
  showPreview?: boolean;
};

type FileFieldConfig = BaseFieldConfig & {
  type: "file";
  multiple?: boolean;
  accept?: string;
  savedFiles?: string | Array<{ name: string; url: string }>;
};

type ImageFieldConfig = BaseFieldConfig & {
  type: "image";
  accept?: string;
  savedFiles?: string | Array<{ name: string; url: string }>;
};

type ImagesFieldConfig = BaseFieldConfig & {
  type: "images";
  accept?: string;
  savedFiles?: string | Array<{ name: string; url: string }> | string[];
};

type AttachmentFieldConfig = BaseFieldConfig & {
  type: "attachment";
  multiple?: boolean;
  accept?: string;
  savedFiles?: string | Array<{ name: string; url: string }>;
  uploadButtonLabel?: string;
};

type DateRangeFieldConfig = BaseFieldConfig & {
  type: "daterange";
  startDateKey?: string;
  endDateKey?: string;
};

export interface CustomButton {
  label: string;
  onClick: (data: any) => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  icon?: LucideIcon | React.ComponentType<any>; // Add icon prop
  iconPosition?: "left" | "right"; // Add icon position
  iconClassName?: string; // Add custom icon styling
  iconOnly?: boolean; // Show only icon without label
  size?: "default" | "sm" | "lg" | "icon"; // Add size suppor
  hidden?: boolean;
  permission?: string;
}

export interface DataFormProps<TFieldValues extends Record<string, any>> {
  fields: FieldConfig[];
  initialData?: Partial<TFieldValues>;
  onSubmit: (data: TFieldValues) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  submitClassname?: string;
  cancelLabel?: string;
  deleteLabel?: string;
  className?: string;
  disabled?: boolean;
  permission?: string;
  deletePermission?: string;
  useDeleteConfirmation?: boolean;
  deleteConfirmationTitle?: string;
  deleteConfirmationDescription?: string;
  useSubmitConfirmation?: boolean;
  confirmationException?: string[];
  submitConfirmationTitle?: string;
  submitConfirmationDescription?: string;
  customButtons?: CustomButton[];
  hideDefaultSubmit?: boolean;
  submitButtonPosition?: "top" | "bottom";
  formRef?: React.RefObject<HTMLFormElement | null>;
  formClassName?: string;
}

export function DataForm<TFieldValues extends Record<string, any>>({
  fields,
  initialData,
  onSubmit,
  onDelete,
  onCancel,
  submitLabel,
  cancelLabel,
  deleteLabel,
  className,
  submitClassname,
  disabled: formDisabled = false,
  permission,
  deletePermission,
  useDeleteConfirmation = false,
  deleteConfirmationTitle,
  deleteConfirmationDescription,
  useSubmitConfirmation = false,
  confirmationException = [],
  submitConfirmationTitle,
  submitConfirmationDescription,
  customButtons = [],
  hideDefaultSubmit = false,
  submitButtonPosition = "top",
  formRef,
  formClassName,
}: DataFormProps<TFieldValues>) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [passwordVisibility, setPasswordVisibility] = React.useState<{
    [key: string]: boolean;
  }>({});
  // Create refs for all possible attachment inputs
  const attachmentInputsRef = React.useRef<{
    [key: string]: HTMLInputElement | null;
  }>({});
  type PendingData = TFieldValues & {
    _customButtonHandler?: () => void;
  };
  const [pendingSubmitData, setPendingSubmitData] =
    React.useState<PendingData | null>(null);
  const { hasPermission } = usePermissions();
  const hasRequiredPermission = !permission || hasPermission(permission);
  const formFieldDisabled: boolean = formDisabled === true;

  const needsConfirmation = (label: string) => {
    // Check if this button label is in the exceptions list
    return useSubmitConfirmation && !confirmationException.includes(label);
  };
  const schema = z.object(
    fields.reduce(
      (acc, field) => {
        let schema: any;

        if (field.type === "table") {
          schema = field.validation?.required
            ? z.array(z.any()).min(1, "At least one row is required")
            : z.array(z.any()).optional();
        } else if (field.type === "select" && field.multiple) {
          schema = field.validation?.required
            ? z.array(z.string()).min(1, "At least one option is required")
            : z.array(z.string()).default([]);
        } else if (field.type === "select-async" && field.multiple) {
          schema = field.validation?.required
            ? z.array(z.string()).min(1, "At least one option is required")
            : z.array(z.string()).default([]);
        } else if (field.type === "select-async" && !field.multiple) {
          schema = field.validation?.required
            ? z
                .union([z.string(), z.null()])
                .refine(
                  (val) => val !== null && val !== "",
                  "This field is required",
                )
            : z.union([z.string(), z.null()]).nullable().optional();
        } else if (field.type === "select" && !field.multiple) {
          schema = field.validation?.required
            ? z
                .union([z.string(), z.null()])
                .refine(
                  (val) => val !== null && val !== "",
                  "This field is required",
                )
            : z.union([z.string(), z.null()]).nullable().optional();
        } else if (field.type === "dimensions") {
          schema = z
            .object({
              x: field.dimensions.x.validation?.required
                ? z
                    .number()
                    .min(0, `${field.dimensions.x.label} must be positive`)
                : z
                    .number()
                    .min(0, `${field.dimensions.x.label} must be positive`)
                    .optional(),
              y: field.dimensions.y.validation?.required
                ? z
                    .number()
                    .min(0, `${field.dimensions.y.label} must be positive`)
                : z
                    .number()
                    .min(0, `${field.dimensions.y.label} must be positive`)
                    .optional(),
              z: field.dimensions.z.validation?.required
                ? z
                    .number()
                    .min(0, `${field.dimensions.z.label} must be positive`)
                : z
                    .number()
                    .min(0, `${field.dimensions.z.label} must be positive`)
                    .optional(),
            })
            .refine(
              (data) => {
                const { x, y, z } = data;

                // Validate X dimension
                if (x !== undefined && field.dimensions.x.validation) {
                  const xConfig = field.dimensions.x.validation;
                  if (xConfig.min && x < xConfig.min) return false;
                  if (xConfig.max && x > xConfig.max) return false;
                }

                // Validate Y dimension
                if (y !== undefined && field.dimensions.y.validation) {
                  const yConfig = field.dimensions.y.validation;
                  if (yConfig.min && y < yConfig.min) return false;
                  if (yConfig.max && y > yConfig.max) return false;
                }

                // Validate Z dimension
                if (z !== undefined && field.dimensions.z.validation) {
                  const zConfig = field.dimensions.z.validation;
                  if (zConfig.min && z < zConfig.min) return false;
                  if (zConfig.max && z > zConfig.max) return false;
                }

                return true;
              },
              {
                message: "One or more dimensions are outside allowed range",
              },
            );
        } else if (field.type === "file" || field.type === "attachment") {
          if (field.multiple) {
            schema = field.validation?.required
              ? z
                  .array(z.instanceof(File))
                  .min(1, "At least one file is required")
              : z.array(z.instanceof(File)).optional();
          } else {
            // Remove 'const' here - you're assigning to the existing schema variable
            schema = field.validation?.required
              ? z.any().refine((file) => {
                  // For required fields: check if file exists and is valid
                  return file instanceof File && file.size > 0;
                }, "A file is required")
              : z.any().optional().default(undefined);
          }
        } else if (field.type === "image") {
          schema = field.validation?.required
            ? z.any().refine((val) => {
                if (val instanceof File) return val.size > 0;
                if (typeof val === "string") return val.trim().length > 0;
                return false;
              }, "An image is required")
            : z.any().optional().nullable().default(undefined);
        } else if (field.type === "images") {
          schema = field.validation?.required
            ? z
                .array(z.any())
                .min(1, "At least one image is required")
                .refine((val) => {
                  return Array.isArray(val) && val.length > 0 && val.every((v) => {
                    if (v instanceof File) return v.size > 0;
                    if (typeof v === "string") return v.trim().length > 0;
                    return false;
                  });
                }, "All items must be valid images")
            : z.array(z.any()).optional().default([]);
        } else if (field.type === "radio") {
          schema = field.validation?.required
            ? z.union([
                z.string().min(1, "This field is required"),
                z.object({
                  value: z.string(),
                  label: z.string(),
                }),
              ])
            : z.union([
                z.string().optional(),
                z
                  .object({
                    value: z.string(),
                    label: z.string(),
                  })
                  .optional(),
              ]);
        } else if (field.type === "checkbox") {
          schema = field.customInput
            ? z
                .object({
                  checked: z.boolean(),
                  label: z.string().optional(),
                })
                .optional()
            : z.boolean().optional();
        } else if (field.type === "number") {
          schema = z
            .union([z.string(), z.number()])
            .transform((val) => {
              if (typeof val === "string") {
                return val === "" ? undefined : parseInt(val, 10);
              }
              if (typeof val === "number") {
                return val;
              }
              return parseInt(val, 10);
            })
            .pipe(
              z
                .number()
                .optional()
                .refine(
                  (val) => !field.validation?.required || val !== undefined,
                  "This field is required",
                )
                .refine(
                  (val) =>
                    val === undefined ||
                    !field.validation?.min ||
                    val >= field.validation.min,
                  `Minimum value is ${field.validation?.min}`,
                )
                .refine(
                  (val) =>
                    val === undefined ||
                    !field.validation?.max ||
                    val <= field.validation.max,
                  `Maximum value is ${field.validation?.max}`,
                ),
            );
        } else if (field.type === "rupiah") {
          schema = z
            .string()
            .transform((val) => Number(val.replace(/\D/g, "")))
            .pipe(
              (z.number().optional() as any)
                .refine(
                  (val: any) =>
                    !field.validation?.required || val !== undefined,
                  "This field is required",
                )
                .refine(
                  (val: any) =>
                    !field.validation?.min ||
                    val === undefined ||
                    val >= field.validation.min,
                  `Minimum value is ${field.validation?.min}`,
                )
                .refine(
                  (val: any) =>
                    !field.validation?.max ||
                    val === undefined ||
                    val <= field.validation.max,
                  `Maximum value is ${field.validation?.max}`,
                )
                .refine(
                  (val: any) =>
                    !field.validation?.maxLength ||
                    !val ||
                    String(val).length <= field.validation.maxLength,
                  `Maximum length is ${field.validation?.maxLength}`,
                ),
            );
        } else if (field.type === "date") {
          schema = z
            .string()
            .refine(
              (val) =>
                !field.validation?.required ||
                (val !== undefined && val !== ""),
              "This field is required",
            )
            .refine((val) => {
              if (!val || !field.validation?.dateRange) return true;
              const date = new Date(val);
              const { min, max, notBefore, notAfter, compareField } =
                field.validation.dateRange;

              if (min && date < new Date(min)) {
                return false;
              }
              if (max && date > new Date(max)) {
                return false;
              }
              if (notBefore) {
                const compareDate = new Date(
                  form.getValues(notBefore) as string,
                );
                if (date < compareDate) {
                  return false;
                }
              }
              if (notAfter) {
                const compareDate = new Date(
                  form.getValues(notAfter) as string,
                );
                if (date > compareDate) {
                  return false;
                }
              }
              if (compareField) {
                const compareValue = form.getValues(compareField);
                if (compareValue) {
                  const compareDate = new Date(compareValue as string);
                  if (date < compareDate) {
                    return false;
                  }
                }
              }
              return true;
            }, "Date is outside allowed range");
        } else if (field.type === "daterange") {
          const startDateKey = (field as any).startDateKey || "start_date";
          const endDateKey = (field as any).endDateKey || "end_date";

          schema = z
            .object({
              [startDateKey]: z
                .union([z.string(), z.instanceof(Date), z.null()])
                .optional(),
              [endDateKey]: z
                .union([z.string(), z.instanceof(Date), z.null()])
                .optional(),
            })
            .refine((val) => {
              if (!field.validation?.required) return true;
              const start = val?.[startDateKey];
              const end = val?.[endDateKey];
              return (
                start !== undefined &&
                start !== null &&
                start !== "" &&
                end !== undefined &&
                end !== null &&
                end !== ""
              );
            }, "Both start and end dates are required")
            .refine((val) => {
              const startVal = val?.[startDateKey];
              const endVal = val?.[endDateKey];
              if (!startVal || !endVal) return true;
              const startDate = new Date(startVal);
              const endDate = new Date(endVal);
              return startDate <= endDate;
            }, "Start date must be before or equal to end date")
            .refine((val) => {
              if (!field.validation?.dateRange) return true;
              const { min, max } = field.validation.dateRange;
              const startVal = val?.[startDateKey];
              const endVal = val?.[endDateKey];

              if (min) {
                const minDate = new Date(min);
                if (startVal && new Date(startVal) < minDate) return false;
                if (endVal && new Date(endVal) < minDate) return false;
              }
              if (max) {
                const maxDate = new Date(max);
                if (startVal && new Date(startVal) > maxDate) return false;
                if (endVal && new Date(endVal) > maxDate) return false;
              }
              return true;
            }, "Dates must be within the allowed range");
        } else {
          schema = (z.string().optional() as any)
            .refine(
              (val: any) =>
                !field.validation?.required ||
                (val !== undefined && val !== ""),
              "This field is required",
            )
            .refine(
              (val: any) =>
                !field.validation?.minLength ||
                !val ||
                val.length >= field.validation.minLength,
              `Minimum length is ${field.validation?.minLength}`,
            )
            .refine(
              (val: any) =>
                !field.validation?.maxLength ||
                !val ||
                val.length <= field.validation.maxLength,
              `Maximum length is ${field.validation?.maxLength}`,
            )
            .refine(
              (val: any) => {
                if (!val) return true;
                if (field.validation?.pattern) {
                  return new RegExp(field.validation.pattern).test(val);
                }
                if (field.validation?.regex) {
                  const patterns = {
                    email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                    alphanumeric: /^[aA-zZ0-9]+$/,
                    numeric: /^[0-9]+$/,
                    phone: /^(\+?\d{1,3}[- ]?)?\d{10}$/,
                  };

                  for (const [key, pattern] of Object.entries(patterns)) {
                    if (
                      field.validation.regex[
                        key as keyof typeof field.validation.regex
                      ]
                    ) {
                      return pattern.test(val);
                    }
                  }
                }
                return true;
              },
              (val: any) => ({
                message: field.validation?.patternMessage || "Invalid format",
              }),
            )
            .refine(
              (val: any) =>
                !field.validation?.custom ||
                !val ||
                !field.validation.custom(val, form.getValues()),
              (val: any) => ({
                message:
                  field.validation?.custom?.(val, form.getValues()) ||
                  "Invalid value",
              }),
            );
        }

        acc[field.name] = schema;
        return acc;
      },
      {} as Record<string, z.ZodType>,
    ),
  );

  type SchemaType = z.infer<typeof schema>;

  const defaultValues = React.useMemo(() => {
    const defaults = { ...(initialData || {}) } as any;
    fields.forEach((field) => {
      if (field.type === "daterange") {
        const startDateKey = (field as any).startDateKey || "start_date";
        const endDateKey = (field as any).endDateKey || "end_date";
        if (!defaults[field.name]) {
          defaults[field.name] = {
            [startDateKey]: null,
            [endDateKey]: null,
          };
        } else {
          defaults[field.name] = {
            [startDateKey]:
              defaults[field.name][startDateKey] !== undefined
                ? defaults[field.name][startDateKey]
                : null,
            [endDateKey]:
              defaults[field.name][endDateKey] !== undefined
                ? defaults[field.name][endDateKey]
                : null,
          };
        }
      } else if (field.type === "images") {
        if (!defaults[field.name]) {
          if (field.savedFiles) {
            if (typeof field.savedFiles === "string") {
              try {
                const parsed = JSON.parse(field.savedFiles);
                defaults[field.name] = Array.isArray(parsed) ? parsed : [field.savedFiles];
              } catch (e) {
                defaults[field.name] = [field.savedFiles];
              }
            } else if (Array.isArray(field.savedFiles)) {
              defaults[field.name] = field.savedFiles.map((f: any) => typeof f === "object" && f.url ? f.url : f);
            } else {
              defaults[field.name] = [];
            }
          } else {
            defaults[field.name] = [];
          }
        } else if (typeof defaults[field.name] === "string") {
          try {
            const parsed = JSON.parse(defaults[field.name]);
            defaults[field.name] = Array.isArray(parsed) ? parsed : [defaults[field.name]];
          } catch (e) {
            defaults[field.name] = [defaults[field.name]];
          }
        } else if (!Array.isArray(defaults[field.name])) {
          defaults[field.name] = [defaults[field.name]];
        }
      }
    });
    return defaults as SchemaType;
  }, [initialData, fields]);

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  // Subscribe to form values so hidden/show logic recalculates on change
  const watchedValues = form.watch();

  const filteredFields = React.useMemo(() => {
    const formValues = watchedValues;
    return fields.filter((item) => {
      if (typeof item.hide === "function") {
        try {
          return !item.hide(formValues);
        } catch (e) {
          // If hide function throws, keep the field visible to avoid blocking form
          return true;
        }
      }
      return item.hide !== true;
    });
  }, [fields, watchedValues]);

  const renderActionButtons = (position: "top" | "bottom") => {
    // Determine if we should render buttons at this position

    const hasDeletePermission =
      !deletePermission || hasPermission(deletePermission);
    if (!position) return null;
    return (
      <div
        className={`flex justify-end gap-2 ${
          position === "bottom" ? "mt-6" : "mb-4"
        }`}
      >
        {/* Delete Button */}
        {onDelete && hasDeletePermission && (
          <Button
            variant={"destructive"}
            type="button"
            onClick={handleDelete}
            disabled={formDisabled}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteLabel || "Delete"}
          </Button>
        )}

        {/* Cancel Button */}
        {onCancel && hasRequiredPermission && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={formDisabled}
          >
            {cancelLabel || "Cancel"}
          </Button>
        )}

        {/* Custom Buttons */}
        {customButtons?.map((button, index) => {
          const hasButtonPermission =
            !button.permission || hasPermission(button.permission);
          return (
            !button.hidden &&
            hasButtonPermission && (
              <Button
                key={index}
                type="button"
                variant={button.variant || "default"}
                onClick={() => {
                  const data = form.getValues();
                  if (needsConfirmation(button.label)) {
                    setPendingSubmitData({
                      ...data,
                      _customButtonHandler: () => button.onClick(data),
                    } as PendingData);
                    setShowSubmitDialog(true);
                  } else {
                    button.onClick(data);
                  }
                }}
                disabled={formDisabled}
                className={cn(button.iconOnly && "px-2", button.iconClassName)}
              >
                {button.icon &&
                  (button.iconPosition !== "right" || button.iconOnly) && (
                    <button.icon
                      className={cn(
                        "h-4 w-4",
                        !button.iconOnly &&
                          button.iconPosition !== "right" &&
                          "mr-2",
                        button.iconClassName,
                      )}
                    />
                  )}
                {!button.iconOnly && button.label}
                {button.icon &&
                  button.iconPosition === "right" &&
                  !button.iconOnly && (
                    <button.icon
                      className={cn("h-4 w-4 ml-2", button.iconClassName)}
                    />
                  )}
              </Button>
            )
          );
        })}

        {/* Submit Button */}

        {hasRequiredPermission && !hideDefaultSubmit && (
          <Button
            type="submit"
            disabled={formDisabled}
            className={cn("", submitClassname)}
          >
            {submitLabel || "Submit"}
          </Button>
        )}
      </div>
    );
  };

  // Field is disabled if explicitly disabled or if permission is required but not granted
  const getFieldDisabled = (field: FieldConfig): boolean => {
    // Don't disable if field has its own explicit disabled setting
    if (field.disabled !== undefined) {
      return field.disabled;
    }
    // Otherwise check form-level disabled and permissions
    return formDisabled || (!hasRequiredPermission && !!permission);
  };

  const renderField = (field: FieldConfig) => {
    const isFieldDisabled = getFieldDisabled(field);
    switch (field.type) {
      case "select":
        return (
          <Combobox
            options={field.options}
            value={
              (form.getValues(field.name) as any) || (field.multiple ? [] : "")
            }
            onChange={(value: any) => {
              form.setValue(field.name, value, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              });
              if (field.type === "select" && field.onChange) {
                field.onChange(value, form);
              }
            }}
            placeholder={field.placeholder || `Select ${field.label}`}
            className="mt-2"
            disabled={isFieldDisabled}
            multiple={field.multiple}
            enableTree={field.enableTree}
          />
        );
      case "select-async": {
        const resolvedInitialOptions = (() => {
          if (field.initialOptions) return field.initialOptions;

          const relationName = field.name.endsWith("_id")
            ? field.name.slice(0, -3)
            : field.name;

          const relationObj = (initialData as any)?.[relationName];
          if (relationObj) {
            if (Array.isArray(relationObj)) {
              return relationObj.map((item: any) => ({
                value: item.id || item.value,
                label: item.name || item.label || item.title || "",
              }));
            } else if (typeof relationObj === "object") {
              return [
                {
                  value: relationObj.id || relationObj.value,
                  label:
                    relationObj.name ||
                    relationObj.label ||
                    relationObj.title ||
                    "",
                },
              ];
            }
          }
          return [];
        })();

        return (
          <AsyncCombobox
            loadOptions={field.loadOptions}
            value={
              (form.getValues(field.name) as any) || (field.multiple ? [] : "")
            }
            onChange={(value) => {
              form.setValue(field.name, value, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              });
              if (field.type === "select-async" && field.onChange) {
                field.onChange(value, form);
              }
            }}
            placeholder={field.placeholder || `Select ${field.label}`}
            className="w-full mt-2"
            disabled={isFieldDisabled}
            multiple={field.multiple}
            enableTree={field.enableTree}
            debounceMs={field.debounceMs}
            initialOptions={resolvedInitialOptions}
          />
        );
      }
      case "button":
        return (
          <Button
            variant={field.variant || "default"}
            size={field.size}
            className={cn(
              field.width
                ? field.width === "full"
                  ? "w-full"
                  : field.width === "auto"
                    ? ""
                    : `w-${field.width}`
                : "",
              "mt-2 h-full",
              field.className || "",
            )}
            onClick={() => {
              const data = form.getValues();
              field.onClick(data);
            }}
            disabled={isFieldDisabled}
          >
            {field.icon && <field.icon className="w-4 h-4 mr-2" />}
            {field.label}
          </Button>
        );
      case "textarea":
        return (
          <Textarea
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            className="w-full mt-2"
            disabled={isFieldDisabled}
            {...form.register(field.name)}
          />
        );
      case "date":
        const max_year = new Date().getFullYear() + 5;
        const dateVal = form.getValues(field.name) as string | undefined;

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-2",
                  !dateVal && "text-muted-foreground",
                )}
                disabled={isFieldDisabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateVal ? (
                  shortDate(new Date(dateVal))
                ) : (
                  <span>
                    {field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                timeZone="Asia/Jakarta"
                selected={dateVal ? new Date(dateVal) : undefined}
                startMonth={
                  field.validation?.dateRange?.min
                    ? new Date(field.validation.dateRange.min)
                    : undefined
                }
                endMonth={
                  field.validation?.dateRange?.max
                    ? new Date(field.validation.dateRange.max)
                    : new Date(`${max_year}`)
                }
                onSelect={(date) => {
                  const value = date?.toISOString() || "";
                  form.setValue(field.name, value, {
                    shouldValidate: true,
                  });
                  // Call onChange if provided
                  if (field.onChange) {
                    field.onChange(value, form);
                  }
                }}
                // Disable dates after max/notAfter
                disabled={(date: Date) => {
                  const maxDateStr =
                    field.validation?.dateRange?.notAfter ||
                    field.validation?.dateRange?.max;
                  if (maxDateStr) {
                    const maxDate = new Date(maxDateStr);
                    return date > maxDate;
                  }
                  return false;
                }}
              />
            </PopoverContent>
          </Popover>
        );
      case "daterange": {
        const daterangeField = field as DateRangeFieldConfig;
        const startDateKey = daterangeField.startDateKey || "start_date";
        const endDateKey = daterangeField.endDateKey || "end_date";
        const currentValue = (form.getValues(field.name) || {}) as any;
        const fromDate = currentValue[startDateKey]
          ? new Date(currentValue[startDateKey])
          : undefined;
        const toDate = currentValue[endDateKey]
          ? new Date(currentValue[endDateKey])
          : undefined;
        const maxYear = new Date().getFullYear() + 5;

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-2",
                  !fromDate && !toDate && "text-muted-foreground",
                )}
                disabled={isFieldDisabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fromDate ? (
                  toDate ? (
                    <>
                      {shortDate(fromDate)} - {shortDate(toDate)}
                    </>
                  ) : (
                    shortDate(fromDate)
                  )
                ) : (
                  <span>
                    {daterangeField.placeholder ||
                      `Enter ${daterangeField.label.toLowerCase()}`}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                timeZone="Asia/Jakarta"
                selected={{
                  from: fromDate,
                  to: toDate,
                }}
                startMonth={
                  daterangeField.validation?.dateRange?.min
                    ? new Date(daterangeField.validation.dateRange.min)
                    : undefined
                }
                endMonth={
                  daterangeField.validation?.dateRange?.max
                    ? new Date(daterangeField.validation.dateRange.max)
                    : new Date(`${maxYear}`)
                }
                onSelect={(range) => {
                  const updatedValue = {
                    [startDateKey]: range?.from
                      ? range.from.toISOString()
                      : null,
                    [endDateKey]: range?.to ? range.to.toISOString() : null,
                  };
                  form.setValue(
                    daterangeField.name as any,
                    updatedValue as any,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    },
                  );
                  if (daterangeField.onChange) {
                    (daterangeField.onChange as any)(updatedValue, form);
                  }
                }}
                // Disable dates after max/notAfter
                disabled={(date: Date) => {
                  const maxDateStr =
                    daterangeField.validation?.dateRange?.notAfter ||
                    daterangeField.validation?.dateRange?.max;
                  if (maxDateStr) {
                    const maxDate = new Date(maxDateStr);
                    return date > maxDate;
                  }
                  return false;
                }}
              />
            </PopoverContent>
          </Popover>
        );
      }
      case "table":
        if (!("columns" in field)) return null;
        const tableData = (form.getValues(field.name) || []) as any[];

        const renderTableCell = (
          col: TableColumnConfig,
          row: any,
          rowIndex: number,
        ) => {
          switch (col.type) {
            case "file":
              return (
                <div className="space-y-2 mt-2">
                  <Input
                    type="file"
                    id={col.value}
                    multiple={col.multiple}
                    accept={col.accept}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        const newData = [...tableData];
                        if (col.multiple) {
                          const fileArray = Array.from(files);
                          newData[rowIndex] = {
                            ...newData[rowIndex],
                            [col.value]: fileArray,
                          };
                        } else {
                          newData[rowIndex] = {
                            ...newData[rowIndex],
                            [col.value]: files[0],
                          };
                        }
                        form.setValue(field.name, newData, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    disabled={isFieldDisabled}
                    className="w-full"
                  />

                  {/* Display newly selected files */}
                  {col.multiple ? (
                    <div className="text-sm text-muted-foreground">
                      {((form.getValues(col.value) || []) as any).length || 0}{" "}
                      {"File (s) selected"}
                    </div>
                  ) : form.getValues(col.value) ? (
                    <div className="text-sm text-muted-foreground">
                      {(form.getValues(col.value) as any)?.name ||
                        "No file selected"}
                    </div>
                  ) : null}
                </div>
              );
            case "select":
              // Filter options to exclude already selected values in other rows
              const selectedValuesInOtherRows = tableData
                .filter((_, index) => index !== rowIndex)
                .map((otherRow) => otherRow?.[col.value])
                .filter(
                  (value) =>
                    value !== undefined && value !== null && value !== "",
                );

              // Fallback to all options if no options are provided or if there's an issue
              const availableOptions = col.options
                ? col.options.filter(
                    (option) =>
                      !selectedValuesInOtherRows.includes(option.value),
                  )
                : [];

              // Debug logging

              return (
                <Select
                  value={row[col.value] || ""}
                  onValueChange={(value: string) => {
                    const newData = [...tableData];
                    newData[rowIndex] = {
                      ...newData[rowIndex],
                      [col.value]: value,
                    };
                    form.setValue(field.name, newData, {
                      shouldValidate: true,
                    });

                    // Call custom onChange if provided
                    if (col.onChange) {
                      const updateRow = (updates: any) => {
                        const updatedData = [...tableData];
                        updatedData[rowIndex] = {
                          ...updatedData[rowIndex],
                          ...updates,
                        };
                        form.setValue(field.name, updatedData, {
                          shouldValidate: true,
                        });
                      };
                      col.onChange(value, rowIndex, updateRow);
                    }
                  }}
                  disabled={isFieldDisabled || col.disabled}
                >
                  <SelectTrigger className="w-[calc(100%-4px)]">
                    <SelectValue placeholder={`Select ${col.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            case "select-async":
              const updateRowTableAsync = (updates: any) => {
                const updatedData = [...tableData];
                updatedData[rowIndex] = {
                  ...updatedData[rowIndex],
                  ...updates,
                };
                form.setValue(field.name, updatedData, {
                  shouldValidate: true,
                });
              };

              return (
                <AsyncCombobox
                  loadOptions={col.loadOptions || (async () => [])}
                  value={row[col.value] || ""}
                  onChange={(value) => {
                    const newData = [...tableData];
                    newData[rowIndex] = {
                      ...newData[rowIndex],
                      [col.value]: value,
                    };
                    form.setValue(field.name, newData, {
                      shouldValidate: true,
                    });

                    // Call custom onChange if provided
                    if (col.onChange) {
                      col.onChange(value, rowIndex, updateRowTableAsync);
                    }
                  }}
                  placeholder={`Select ${col.label}`}
                  className="w-full max-h-[300px]"
                  disabled={isFieldDisabled || col.disabled}
                  debounceMs={col.debounceMs}
                />
              );
            case "date":
              const max_year = new Date().getFullYear() + 5;
              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !row[col.value] && "text-muted-foreground",
                      )}
                      disabled={isFieldDisabled || col.disabled}
                    >
                      {" "}
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {row[col.value]
                        ? shortDate(new Date(row[col.value]))
                        : `Select ${col.label}`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      timeZone="Asia/Jakarta"
                      selected={
                        row[col.value] ? new Date(row[col.value]) : undefined
                      }
                      endMonth={
                        col?.validation?.dateRange?.max
                          ? new Date(col.validation.dateRange.max)
                          : new Date(`${max_year}`)
                      }
                      onSelect={(date) => {
                        if (date) {
                          // Validate date range if validation is specified
                          if (col.validation?.dateRange) {
                            const { notBefore, notAfter } =
                              col.validation.dateRange;

                            // Check notBefore constraint - compare with another column in same row
                            if (notBefore && row[notBefore]) {
                              const beforeDate = new Date(row[notBefore]);
                              if (date < beforeDate) {
                                toast.error("ValidationError", {
                                  description: `${col.label} must be after ${notBefore}`,
                                });
                                return;
                              }
                            }

                            // Check notAfter constraint - compare with another column in same row
                            if (notAfter && row[notAfter]) {
                              const afterDate = new Date(row[notAfter]);
                              if (date > afterDate) {
                                toast.error("ValidationError", {
                                  description: `${col.label} must be before ${notAfter}`,
                                });
                                return;
                              }
                            }
                          }

                          const newData = [...tableData];
                          newData[rowIndex] = {
                            ...newData[rowIndex],
                            [col.value]: date.toISOString(),
                          };
                          form.setValue(field.name, newData, {
                            shouldValidate: true,
                          });
                        }
                      }}
                      disabled={isFieldDisabled || col.disabled}
                    />
                  </PopoverContent>
                </Popover>
              );
            case "checkbox":
              return (
                <div className="flex items-center justify-center h-full">
                  <Checkbox
                    checked={row[col.value] === true}
                    onCheckedChange={(checked) => {
                      const newData = [...tableData];
                      newData[rowIndex] = {
                        ...newData[rowIndex],
                        [col.value]: checked,
                      };
                      form.setValue(field.name, newData, {
                        shouldValidate: true,
                      });
                    }}
                    disabled={isFieldDisabled || col.disabled}
                  />
                </div>
              );
            case "number":
              return (
                <Input
                  type="number"
                  step="any"
                  value={row[col.value] ?? ""}
                  onChange={(e) => {
                    const newData = [...tableData];
                    const numValue =
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value);
                    newData[rowIndex] = {
                      ...newData[rowIndex],
                      [col.value]: numValue,
                    };
                    form.setValue(field.name, newData, {
                      shouldValidate: true,
                    });

                    // Call custom onChange if provided
                    if (col.onChange) {
                      const updateRow = (updates: any) => {
                        const updatedData = [...tableData];
                        updatedData[rowIndex] = {
                          ...updatedData[rowIndex],
                          ...updates,
                        };
                        form.setValue(field.name, updatedData, {
                          shouldValidate: true,
                        });
                      };
                      col.onChange(numValue, rowIndex, updateRow);
                    }
                  }}
                  className="w-full"
                  disabled={isFieldDisabled || col.disabled}
                />
              );
            default:
              return col.type === "textarea" ? (
                <Textarea
                  value={row[col.value] || ""}
                  onChange={(e) => {
                    const newData = [...tableData];
                    newData[rowIndex] = {
                      ...newData[rowIndex],
                      [col.value]: e.target.value,
                    };
                    form.setValue(field.name, newData, {
                      shouldValidate: true,
                    });
                  }}
                  className="w-full"
                  disabled={isFieldDisabled || col.disabled}
                />
              ) : (
                <Input
                  type="text"
                  value={row[col.value] || ""}
                  onChange={(e) => {
                    const newData = [...tableData];
                    newData[rowIndex] = {
                      ...newData[rowIndex],
                      [col.value]: e.target.value,
                    };
                    form.setValue(field.name, newData, {
                      shouldValidate: true,
                    });
                  }}
                  className="w-full"
                  disabled={isFieldDisabled || col.disabled}
                />
              );
          }
        };

        return (
          <div className="w-full h-fit mt-2 flex flex-col">
            <Button
              type="button"
              onClick={() => {
                form.setValue(field.name, [...tableData, {}], {
                  shouldValidate: true,
                });
              }}
              className="mb-2 self-end"
              disabled={isFieldDisabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
            <ScrollArea className="h-fit border rounded-md">
              <table className="w-full">
                <thead>
                  <tr>
                    {[
                      ...(field.columns || []),
                      { label: "Actions", value: "actions" },
                    ].map((col) => (
                      <th
                        key={col.value}
                        className="p-2 text-left bg-muted first:rounded-tl-md last:rounded-tr-md"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row: any, rowIndex: number) => (
                    <tr
                      key={rowIndex}
                      className="border-t hover:bg-muted/50 items-start"
                    >
                      {[
                        ...(field.columns || []),
                        { label: "Actions", value: "actions" },
                      ].map((col) => (
                        <td key={col.value} className="p-2">
                          {col.value === "actions" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const newData = tableData.filter(
                                  (_: unknown, i: number) => i !== rowIndex,
                                );
                                form.setValue(field.name, newData, {
                                  shouldValidate: true,
                                });
                              }}
                              disabled={isFieldDisabled}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : (
                            renderTableCell(
                              col as TableColumnConfig,
                              row,
                              rowIndex,
                            )
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        );

      case "radio":
        return (
          <div
            className={cn(
              "flex  space-y-2 mt-2",
              field.direction && `flex-${field.direction}`,
            )}
          >
            {field.options?.map((option) => {
              const currentValue = form.getValues(field.name);
              const isSelected = option.customInput
                ? currentValue === option.label
                : currentValue === option.value;

              return (
                <div
                  key={option.value}
                  className="flex items-center  w-full space-x-2"
                >
                  {option.customInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => {
                          form.setValue(field.name, option.label, {
                            shouldValidate: true,
                          });
                        }}
                        className="h-4 w-4 text-primary border-primary"
                      />
                      <Input
                        type="text"
                        value={option.label}
                        onChange={(e) => {
                          const newLabel = e.target.value;
                          option.label = newLabel;

                          // If this option is selected, update form value to match new label
                          if (isSelected) {
                            form.setValue(field.name, newLabel, {
                              shouldValidate: true,
                            });
                          }
                        }}
                        placeholder={
                          field.placeholder || `Select ${field.label}`
                        }
                        className="w-full"
                        disabled={isFieldDisabled}
                        onClick={(e) => {
                          // Select this option when clicking input
                          if (!isSelected) {
                            form.setValue(field.name, option.label, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <label className="flex items-center space-x-2 w-full">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => {
                          form.setValue(field.name, option.value, {
                            shouldValidate: true,
                          });
                        }}
                        className="h-4 w-4 text-primary border-primary"
                      />
                      <span className="w-fit">{option.label}</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        );
      case "dimensions":
        const dimensionsValue = (form.getValues(field.name) || {}) as any;

        const updateDimension = (dim: "x" | "y" | "z", value: string) => {
          const numValue = value === "" ? undefined : parseFloat(value);
          const currentDimensions = (form.getValues(field.name) || {}) as any;

          const newDimensions = {
            ...currentDimensions,
            [dim]: numValue,
          };

          form.setValue(field.name, newDimensions, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });

          if (field.onChange) {
            field.onChange(newDimensions, form);
          }
        };

        return (
          <div className="space-y-3 mt-2">
            {/* Individual Dimension Inputs */}
            <div className="grid grid-cols-3 gap-3">
              {(["x", "y", "z"] as const).map((dim) => {
                const config = field.dimensions[dim];
                const value = dimensionsValue[dim];

                return (
                  <div key={dim} className="space-y-2 ">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        step="any"
                        placeholder={config.placeholder || "0"}
                        value={value !== undefined ? value : ""}
                        onChange={(e) => updateDimension(dim, e.target.value)}
                        className="w-full"
                        disabled={isFieldDisabled}
                        min={config.validation?.min}
                        max={config.validation?.max}
                      />
                      {dim !== "z" && <X />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Display Combined Dimensions if showDimensionDisplay is true */}
            {field.showDimensionDisplay &&
              dimensionsValue.x !== undefined &&
              dimensionsValue.y !== undefined &&
              dimensionsValue.z !== undefined && (
                <div className="text-sm text-muted-foreground text-center mt-2">
                  <span className="font-medium">
                    {dimensionsValue.x} × {dimensionsValue.y} ×{" "}
                    {dimensionsValue.z}
                  </span>
                </div>
              )}
          </div>
        );

      case "checkbox":
        const checkboxVal = (form.getValues(field.name) || {}) as any;
        return (
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              checked={
                Boolean(checkboxVal.checked) ||
                Boolean(form.getValues(field.name))
              }
              onCheckedChange={(checked) => {
                field.onChange?.(checked, form);
                if (field.customInput) {
                  form.setValue(
                    field.name,
                    {
                      checked: Boolean(checked),
                      label: checkboxVal.label || field.label || "",
                    },
                    {
                      shouldValidate: true,
                    },
                  );
                } else {
                  form.setValue(field.name, Boolean(checked), {
                    shouldValidate: true,
                  });
                }
              }}
              disabled={isFieldDisabled}
            />
            {field.customInput ? (
              <Input
                type="text"
                value={checkboxVal.label || field.label || ""}
                onChange={(e) => {
                  form.setValue(
                    field.name,
                    {
                      checked: Boolean(checkboxVal.checked),
                      label: e.target.value,
                    },
                    {
                      shouldValidate: true,
                    },
                  );
                }}
                placeholder={
                  field.placeholder || `Enter ${field.label.toLowerCase()}`
                }
                className="w-auto"
                disabled={isFieldDisabled || !checkboxVal.checked}
              />
            ) : (
              <label
                htmlFor={field.name}
                className="text-sm font-medium leading-none"
              >
                {field.label}
              </label>
            )}
          </div>
        );
      case "image":
        return (
          <ImageField
            field={field}
            form={form}
            isFieldDisabled={isFieldDisabled}
          />
        );
      case "images":
        return (
          <ImagesField
            field={field}
            form={form}
            isFieldDisabled={isFieldDisabled}
          />
        );
      case "file":
        return (
          <div className="space-y-2 mt-2">
            <Input
              type="file"
              id={field.name}
              multiple={field.multiple}
              accept={field.accept}
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  if (field.multiple) {
                    const fileArray = Array.from(files);
                    form.setValue(field.name, fileArray, {
                      shouldValidate: true,
                    });
                  } else {
                    form.setValue(field.name, files[0], {
                      shouldValidate: true,
                    });
                  }
                }
              }}
              placeholder={field.placeholder || `Select ${field.label}`}
              disabled={isFieldDisabled}
              className="w-full"
            />

            {/* Display saved files if they exist */}
            {field.savedFiles &&
              (() => {
                let parsedFiles: Array<{ name: string; url: string }> = [];
                if (
                  typeof field.savedFiles === "string" &&
                  field.savedFiles.charAt(0) === "["
                ) {
                  try {
                    const parsed = JSON.parse(field.savedFiles);
                    if (Array.isArray(parsed)) parsedFiles = parsed;
                  } catch (e) {
                    parsedFiles = [];
                  }
                } else if (Array.isArray(field.savedFiles)) {
                  parsedFiles = field.savedFiles;
                } else {
                  parsedFiles = [
                    {
                      name: field.name,
                      url: `https://eam-api.avolut.com${field.savedFiles}`,
                    },
                  ];
                }
                return parsedFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium"></p>
                    <ul className="space-y-1">
                      {parsedFiles.map((file, index) => (
                        <li key={index} className="flex items-center">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            {file.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

            {/* Display newly selected files */}
            {field.multiple ? (
              <div className="text-sm text-muted-foreground">
                {((form.getValues(field.name) || []) as any).length || 0}{" "}
                {"File(s) selected"}
              </div>
            ) : form.getValues(field.name) ? (
              <div className="text-sm text-muted-foreground">
                {(form.getValues(field.name) as any)?.name ||
                  "No file selected"}
              </div>
            ) : null}
          </div>
        );
      case "attachment": {
        return (
          <div className="space-y-3 mt-2">
            <input
              ref={(el) => {
                if (el) attachmentInputsRef.current[field.name] = el;
              }}
              type="file"
              multiple={field.multiple}
              accept={field.accept}
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  if (field.multiple) {
                    const fileArray = Array.from(files);
                    form.setValue(field.name, fileArray, {
                      shouldValidate: true,
                    });
                  } else {
                    form.setValue(field.name, files[0], {
                      shouldValidate: true,
                    });
                  }
                }
              }}
              disabled={isFieldDisabled}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => attachmentInputsRef.current[field.name]?.click()}
              disabled={isFieldDisabled}
              className=""
            >
              <FilePlus className="h-4 w-4 mr-2" />
              {field.uploadButtonLabel || "Upload "}
            </Button>

            {field.multiple
              ? ((form.getValues(field.name) || []) as any).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected Files</p>
                    <ul className="space-y-2">
                      {Array.from(
                        (form.getValues(field.name) || []) as any,
                      ).map((file: any, index: number) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 p-2 bg-muted rounded-md"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              : Boolean(form.getValues(field.name)) && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">
                      {(form.getValues(field.name) as any)?.name}
                    </span>
                  </div>
                )}
          </div>
        );
      }
      case "separator":
        return null;
      default:
        return (
          <div className="relative flex items-center gap-4">
            {field.prefix && (
              <div className="text-sm text-muted-foreground pointer-events-none whitespace-nowrap ">
                {field.prefix}
              </div>
            )}
            <Input
              type={
                field.type === "rupiah"
                  ? "text"
                  : field.type === "password"
                    ? passwordVisibility[field.name]
                      ? "text"
                      : "password"
                    : field.type === "number"
                      ? "number"
                      : field.type
              }
              step={field.type === "number" ? "any" : undefined}
              onInput={(e) => {
                if (field.type === "rupiah") {
                  const input = e.currentTarget;
                  // Remove non-numeric characters
                  let value = input.value.replace(/\D/g, "");
                  // Format as Rupiah
                  if (value) {
                    value = new Intl.NumberFormat("id-ID").format(
                      Number(value),
                    );
                    form.setValue(field.name, value, { shouldValidate: true });
                  }
                }
              }}
              placeholder={
                field.placeholder || `Input ${field.label.toLowerCase()}`
              }
              className={cn(
                "w-full mt-2",
                field.type === "password" && "pr-10",
              )}
              disabled={isFieldDisabled}
              autoComplete={
                field.type === "password" ? "current-password" : undefined
              }
              {...form.register(field.name)}
            />
            {field.type === "password" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-[9px] h-9 w-9 px-3"
                onClick={() => {
                  setPasswordVisibility((prev) => ({
                    ...prev,
                    [field.name]: !prev[field.name],
                  }));
                }}
              >
                {passwordVisibility[field.name] ? (
                  <EyeOff className="h-4 w-4 mb-2" />
                ) : (
                  <Eye className="h-4 w-4 mb-2" />
                )}
              </Button>
            )}
          </div>
        );
    }
  };

  const handleDelete = () => {
    if (useDeleteConfirmation) {
      setShowDeleteDialog(true);
    } else {
      onDelete?.();
    }
  };

  return (
    <Form {...form}>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirmationTitle ||
                "Are you sure you want to delete this item?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmationDescription || "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {submitConfirmationTitle || "Are you sure you want to submit?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {submitConfirmationDescription ||
                "Please confirm that you want to proceed with this action."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSubmitData) {
                  // Check if this is a custom button action
                  if ("_customButtonHandler" in pendingSubmitData) {
                    const handler = (pendingSubmitData as any)
                      ._customButtonHandler;
                    handler();
                  } else {
                    onSubmit(pendingSubmitData);
                  }
                  setShowSubmitDialog(false);
                  setPendingSubmitData(null);
                }
              }}
            >
              {submitLabel || "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <form
        ref={formRef}
        onSubmit={form.handleSubmit((data) => {
          // Process prefix fields
          const processedData = { ...data };
          fields.forEach((field) => {
            if (
              field.prefix &&
              field.includePrefix &&
              field.name in processedData
            ) {
              const prefixStr =
                typeof field.prefix === "string" ? field.prefix : "";
              if (processedData[field.name]) {
                processedData[field.name] =
                  prefixStr + processedData[field.name];
              }
            }
          });

          if (needsConfirmation(submitLabel || "Submit")) {
            setPendingSubmitData(processedData as TFieldValues);
            setShowSubmitDialog(true);
          } else {
            onSubmit(processedData as TFieldValues);
          }
        })}
        className={cn("space-y-4 px-2", className)}
      >
        {submitButtonPosition === "top" && renderActionButtons("top")}
        <div className="grid grid-cols-12 gap-4 items-start">
          {filteredFields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem
                  className={cn("", formClassName, {
                    "col-span-12": !field.width || field.width === "full",
                    "col-span-6": field.width === "1/2",
                    "col-span-4": field.width === "1/3",
                    "col-span-3": field.width === "1/4",
                    "col-span-8": field.width === "2/3",
                    "col-span-9": field.width === "3/4",
                    "col-auto": field.width === "auto",
                  })}
                >
                  <FormLabel className="">
                    {field.type === "button" &&
                    !field.label ? null : field.type === "separator" ? (
                      <h3 className="text-lg font-semibold">{field.label}</h3>
                    ) : (
                      field.label
                    )}
                    {field.validation?.required && (
                      <span className="text-red-500">*</span>
                    )}
                  </FormLabel>
                  <FormControl className="w-full">
                    {renderField(field)}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        {submitButtonPosition === "bottom" && renderActionButtons("bottom")}
      </form>
    </Form>
  );
}

const ImageField = ({
  field,
  form,
  isFieldDisabled,
}: {
  field: ImageFieldConfig;
  form: UseFormReturn<any>;
  isFieldDisabled: boolean;
}) => {
  const value = form.watch(field.name);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    if (typeof value === "string") {
      setPreviewUrl(value);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      form.setValue(field.name, files[0], {
        shouldValidate: true,
      });
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    form.setValue(field.name, null, {
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-3 mt-2">
      <div className="relative group flex items-center justify-center border-2 border-dashed rounded-xl overflow-hidden aspect-video max-w-sm bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border-muted-foreground/30 hover:border-primary/50">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={field.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => document.getElementById(`image-input-${field.name}`)?.click()}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                Remove
              </Button>
            </div>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground"
            onClick={() => document.getElementById(`image-input-${field.name}`)?.click()}
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">Click to upload image</span>
            <span className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, GIF up to 5MB</span>
          </div>
        )}
        <input
          type="file"
          id={`image-input-${field.name}`}
          className="hidden"
          accept={field.accept || "image/*"}
          onChange={handleFileChange}
          disabled={isFieldDisabled}
        />
      </div>
    </div>
  );
};

const ImagesField = ({
  field,
  form,
  isFieldDisabled,
}: {
  field: ImagesFieldConfig;
  form: UseFormReturn<any>;
  isFieldDisabled: boolean;
}) => {
  const value = form.watch(field.name);
  const valuesArray = React.useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);

  React.useEffect(() => {
    const urls: string[] = [];
    const cleanups: (() => void)[] = [];

    valuesArray.forEach((val) => {
      if (val instanceof File) {
        const objectUrl = URL.createObjectURL(val);
        urls.push(objectUrl);
        cleanups.push(() => URL.revokeObjectURL(objectUrl));
      } else if (typeof val === "string") {
        urls.push(val);
      } else if (val && typeof val === "object" && "url" in val) {
        urls.push((val as any).url);
      }
    });

    setPreviewUrls(urls);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [valuesArray]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      form.setValue(field.name, [...valuesArray, ...newFiles], {
        shouldValidate: true,
      });
    }
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updatedValues = valuesArray.filter((_, i) => i !== index);
    form.setValue(field.name, updatedValues, {
      shouldValidate: true,
    });
  };

  const triggerUpload = () => {
    document.getElementById(`images-input-${field.name}`)?.click();
  };

  return (
    <div className="space-y-4 mt-2">
      {/* Main Preview / Carousel */}
      {previewUrls.length > 0 ? (
        <div className="relative group w-full border rounded-xl overflow-hidden bg-muted/10 max-w-xl mx-auto">
          <Carousel className="w-full">
            <CarouselContent>
              {previewUrls.map((url, index) => (
                <CarouselItem key={index} className="relative aspect-[16/9] w-full flex items-center justify-center bg-black/5">
                  <img
                    src={url}
                    alt={`${field.label} preview ${index + 1}`}
                    className="w-full h-full object-contain max-h-[350px]"
                  />
                  {/* Remove Button for current slide */}
                  <div className="absolute top-3 right-3 z-10">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      className="rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity"
                      onClick={(e) => handleRemove(index, e)}
                      disabled={isFieldDisabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {previewUrls.length > 1 && (
              <>
                <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black border-none shadow-md" />
                <CarouselNext className="right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black border-none shadow-md" />
              </>
            )}
          </Carousel>
        </div>
      ) : (
        /* Empty State Dropzone */
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl overflow-hidden aspect-video max-w-xl mx-auto bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer border-muted-foreground/30 hover:border-primary/50 p-6 text-center group"
          onClick={triggerUpload}
        >
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            Click to upload images
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Supports PNG, JPG, GIF (Multiple selection allowed)
          </span>
        </div>
      )}

      {/* Grid of Thumbnails and Add Button */}
      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2.5 items-center justify-center max-w-xl mx-auto py-2">
          {previewUrls.map((url, index) => (
            <div
              key={index}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-muted-foreground/20 bg-muted/30 aspect-square flex-shrink-0"
            >
              <img
                src={url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay with remove button on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                <button
                  type="button"
                  onClick={(e) => handleRemove(index, e)}
                  disabled={isFieldDisabled}
                  className="p-1 rounded bg-destructive text-destructive-foreground hover:scale-110 transition-transform"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more images button in the grid */}
          <button
            type="button"
            onClick={triggerUpload}
            disabled={isFieldDisabled}
            className="w-16 h-16 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary/50 flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/30 transition-all text-muted-foreground hover:text-primary"
            title="Add more images"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}

      <input
        type="file"
        id={`images-input-${field.name}`}
        className="hidden"
        accept={field.accept || "image/*"}
        multiple
        onChange={handleFileChange}
        disabled={isFieldDisabled}
      />
    </div>
  );
};
