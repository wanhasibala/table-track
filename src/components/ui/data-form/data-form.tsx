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
import { useTranslation } from "@/lib/use-translation";
import {toast} from "sonner"
// import { IconSelector } from "../icon-selector";
import { HTMLProps } from "react";
// import MonthYearPicker from "../month-year-picker";

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
  | "month";

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
  variant?: "default" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
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
  onChange?: (value: string, form: any) => void;
};

type SelectAsyncFieldConfig = BaseFieldConfig & {
  type: "select-async";
  loadOptions: (searchTerm: string) => Promise<SelectConfig[]>;
  multiple?: boolean;
  enableTree?: boolean;
  debounceMs?: number;
  initialOptions?: SelectConfig[];
  onChange?: (value: string, form: any) => void;
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

type AttachmentFieldConfig = BaseFieldConfig & {
  type: "attachment";
  multiple?: boolean;
  accept?: string;
  savedFiles?: string | Array<{ name: string; url: string }>;
  uploadButtonLabel?: string;
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
  const { t } = useTranslation();

  const needsConfirmation = (label: string) => {
    // Check if this button label is in the exceptions list
    return useSubmitConfirmation && !confirmationException.includes(label);
  };
  const schema = z.object(
    fields.reduce(
      (acc, field) => {
        let schema: z.ZodType;

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
            ? z.union([z.string(), z.null()]).refine(
                (val) => val !== null && val !== "",
                "This field is required"
              )
            : z.union([z.string(), z.null()]).nullable().optional();
        } else if (field.type === "select" && !field.multiple) {
          schema = field.validation?.required
            ? z.union([z.string(), z.null()]).refine(
                (val) => val !== null && val !== "",
                "This field is required"
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
              z
                .number()
                .optional()
                .refine(
                  (val) => !field.validation?.required || val !== undefined,
                  "This field is required",
                )
                .refine(
                  (val) =>
                    !field.validation?.min ||
                    val === undefined ||
                    val >= field.validation.min,
                  `Minimum value is ${field.validation?.min}`,
                )
                .refine(
                  (val) =>
                    !field.validation?.max ||
                    val === undefined ||
                    val <= field.validation.max,
                  `Maximum value is ${field.validation?.max}`,
                )
                .refine(
                  (val) =>
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
                const compareDate = new Date(form.getValues(notBefore));
                if (date < compareDate) {
                  return false;
                }
              }
              if (notAfter) {
                const compareDate = new Date(form.getValues(notAfter));
                if (date > compareDate) {
                  return false;
                }
              }
              if (compareField) {
                const compareValue = form.getValues(compareField);
                if (compareValue) {
                  const compareDate = new Date(compareValue);
                  if (date < compareDate) {
                    return false;
                  }
                }
              }
              return true;
            }, "Date is outside allowed range");
        } else {
          schema = z
            .string()
            .optional()
            .refine(
              (val) =>
                !field.validation?.required ||
                (val !== undefined && val !== ""),
              "This field is required",
            )
            .refine(
              (val) =>
                !field.validation?.minLength ||
                !val ||
                val.length >= field.validation.minLength,
              `Minimum length is ${field.validation?.minLength}`,
            )
            .refine(
              (val) =>
                !field.validation?.maxLength ||
                !val ||
                val.length <= field.validation.maxLength,
              `Maximum length is ${field.validation?.maxLength}`,
            )
            .refine(
              (val) => {
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
              (val) => ({
                message: field.validation?.patternMessage || "Invalid format",
              }),
            )
            .refine(
              (val) =>
                !field.validation?.custom ||
                !val ||
                !field.validation.custom(val, form.getValues()),
              (val) => ({
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

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: (initialData || {}) as SchemaType,
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
            {deleteLabel || t("data_form.button.delete")}
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
            {cancelLabel || t("data_form.button.cancel")}
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
            {submitLabel || t("data_form.button.submit")}
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
            value={form.getValues(field.name) || (field.multiple ? [] : "")}
            onChange={(value) => {
              form.setValue(field.name, value, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              });
              if (field.type === "select" && field.onChange) {
                field.onChange(value, form);
              }
            }}
            placeholder={field.placeholder || `${t("data_form.placeholder.select")} ${field.label}`}
            className="mt-2"
            disabled={isFieldDisabled}
            multiple={field.multiple}
            enableTree={field.enableTree}
          />
        );
      case "select-async":
        return (
          <AsyncCombobox
            loadOptions={field.loadOptions}
            value={form.getValues(field.name) || (field.multiple ? [] : "")}
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
            placeholder={field.placeholder || `${t("data_form.placeholder.select")} ${field.label}`}
            className="w-full mt-2"
            disabled={isFieldDisabled}
            multiple={field.multiple}
            enableTree={field.enableTree}
            debounceMs={field.debounceMs}
            initialOptions={field.initialOptions}
          />
        );
      case "button":
        return (
          <Button
            variant={field.variant || ""}
            size={
              field.size === "sm" ? "sm" : field.size === "lg" ? "lg" : "md"
            }
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
            placeholder={field.placeholder || `${t("data_form.placeholder.input")} ${field.label.toLowerCase()}`}
            className="w-full mt-2"
            disabled={isFieldDisabled}
            {...form.register(field.name)}
          />
        );
      // case "month":
      //   return (
      //     <MonthYearPicker
      //       onDateChange={(date) => {
      //         const value = date?.toISOString() || "";
      //         form.setValue(field.name, value, {
      //           shouldValidate: true,
      //         });
      //         // Call onChange if provided
      //         if (field.onChange) {
      //           field.onChange(value, form);
      //         }
      //       }}
      //     />
      //   );
      case "date":
        const max_year = new Date().getFullYear() + 5;

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-2",
                  !form.getValues(field.name) && "text-muted-foreground",
                )}
                disabled={isFieldDisabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.getValues(field.name) ? (
                  shortDate(new Date(form.getValues(field.name)))
                ) : (
                  <span>{field.placeholder || `${t("data_form.placeholder.date")}`}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                timeZone="Asia/Jakarta"
                selected={
                  form.getValues(field.name)
                    ? new Date(form.getValues(field.name))
                    : undefined
                }
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
                initialFocus
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
      case "table":
        if (!("columns" in field)) return null;
        const tableData = form.getValues(field.name) || [];

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

                  {/* Display saved files if they exist */}
                  {col.savedFiles &&
                    (() => {
                      let parsedFiles: Array<{ name: string; url: string }> =
                        [];
                      if (
                        typeof col.savedFiles === "string" &&
                        col.savedFiles.charAt(0) === "["
                      ) {
                        try {
                          const parsed = JSON.parse(col.savedFiles);
                          if (Array.isArray(parsed)) parsedFiles = parsed;
                        } catch (e) {
                          parsedFiles = [];
                        }
                      } else if (Array.isArray(col.savedFiles)) {
                        parsedFiles = col.savedFiles;
                      } else {
                        parsedFiles = [
                          {
                            name: col.value,
                            url: `https://eam-api.avolut.com${col?.savedFiles}`,
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
                  {col.multiple ? (
                    <div className="text-sm text-muted-foreground">
                      {form.getValues(col.value)?.length || 0}{" "}
                      {t("status.files_selected")}
                    </div>
                  ) : form.getValues(col.value) ? (
                    <div className="text-sm text-muted-foreground">
                      {form.getValues(col.value)?.name ||
                        t("status.no_file_selected")}
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
                  placeholder={`${t("data_form.placeholder.select")} ${col.label}`}
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
                        : `${t("data_form.placeholder.search")} ${col.label}`}
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
                                toast({
                                  title: "Validation Error",
                                  description: `${col.label} must be after ${notBefore}`,
                                  variant: "destructive",
                                });
                                return;
                              }
                            }

                            // Check notAfter constraint - compare with another column in same row
                            if (notAfter && row[notAfter]) {
                              const afterDate = new Date(row[notAfter]);
                              if (date > afterDate) {
                                toast({
                                  title: "Validation Error",
                                  description: `${col.label} must be before ${notAfter}`,
                                  variant: "destructive",
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
                      initialFocus
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
                        placeholder={field.placeholder || `${t("data_form.placeholder.search")} ${field.label}`}
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
        const dimensionsValue = form.getValues(field.name) || {};

        const updateDimension = (dim: "x" | "y" | "z", value: string) => {
          const numValue = value === "" ? undefined : parseFloat(value);
          const currentDimensions = form.getValues(field.name) || {};

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
      // case "icon":
      //   return (
      //     <IconSelector
      //       value={form.getValues(field.name)}
      //       onChange={(value) => {
      //         form.setValue(field.name, value, {
      //           shouldValidate: true,
      //           shouldDirty: true,
      //           shouldTouch: true,
      //         });
      //         if (field.onChange) {
      //           field.onChange(value, form);
      //         }
      //       }}
      //       placeholder={field.placeholder || `${t("data_form.placeholder.select")} ${field.label}`}
      //       disabled={isFieldDisabled}
      //       showPreview={field.showPreview !== false}
      //     />
      //   );
      case "checkbox":
        return (
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              checked={
                Boolean(form.getValues(field.name)?.checked) ||
                Boolean(form.getValues(field.name))
              }
              onCheckedChange={(checked) => {
                field.onChange?.(checked, form);
                if (field.customInput) {
                  form.setValue(
                    field.name,
                    {
                      checked: Boolean(checked),
                      label:
                        form.getValues(field.name)?.label || field.label || "",
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
                value={form.getValues(field.name)?.label || field.label || ""}
                onChange={(e) => {
                  form.setValue(
                    field.name,
                    {
                      checked: Boolean(form.getValues(field.name)?.checked),
                      label: e.target.value,
                    },
                    {
                      shouldValidate: true,
                    },
                  );
                }}
                placeholder={field.placeholder || `${t("data_form.placeholder.input")} ${field.label.toLowerCase()}`}
                className="w-auto"
                disabled={
                  isFieldDisabled || !form.getValues(field.name)?.checked
                }
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
              placeholder={field.placeholder || `${t("data_form.placeholder.select")} ${field.label}`}
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
                {form.getValues(field.name)?.length || 0}{" "}
                {t("status.files_selected")}
              </div>
            ) : form.getValues(field.name) ? (
              <div className="text-sm text-muted-foreground">
                {form.getValues(field.name)?.name ||
                  t("status.no_file_selected")}
              </div>
            ) : null}
          </div>
        );
      case "attachment": {
        return (
          <div className="space-y-3 mt-2">
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
                    <p className="text-sm font-medium">
                      {t("status.saved_file")}
                    </p>
                    <ul className="space-y-2">
                      {parsedFiles.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 p-2 bg-muted rounded-md"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm truncate"
                          >
                            {file.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}
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

            {/* Display newly selected files */}
            {field.multiple
              ? form.getValues(field.name)?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected Files</p>
                    <ul className="space-y-2">
                      {Array.from(form.getValues(field.name) || []).map(
                        (file: File, index: number) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 p-2 bg-muted rounded-md"
                          >
                            <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">
                              {file.name}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )
              : form.getValues(field.name) && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">
                      {form.getValues(field.name)?.name}
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
              placeholder={field.placeholder || `${t("data_form.placeholder.input")} ${field.label.toLowerCase()}`}
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
                t("data_form.confirmation.delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmationDescription ||
                t("data_form.confirmation.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("data_form.confirmation.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
            >
              {t("data_form.button.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {submitConfirmationTitle ||
                t("data_form.confirmation.submit.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {submitConfirmationDescription ||
                t("data_form.confirmation.submit.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("data_form.confirmation.cancel")}
            </AlertDialogCancel>
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
              {submitLabel || t("data_form.button.submit")}
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

          if (needsConfirmation(submitLabel || t("data_form.button.submit"))) {
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
