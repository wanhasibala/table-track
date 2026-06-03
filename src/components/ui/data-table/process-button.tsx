"use client";
import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../popover";
import { Button } from "../button";
import { LucideIcon, Settings } from "lucide-react";
// import { icons } from "../icon-selector";
import { IconRenderer } from "./advanced-table";
import { cn } from "@/lib/utils";

export interface ProcessButton {
  label: string;
  onClick: () => void;
  icon?: LucideIcon | string;
  disabled?: boolean;
  hide?: boolean;
  variant?: "default" | "destructive" | "outline";
  className?: string;
}
interface ProcessButtonProps {
  processButton: ProcessButton[];
}

export const ProcessButtonComponent = ({ processButton }: ProcessButtonProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"outline"}>
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="space-y-2">
        {processButton?.map((button, index) => {
          // Handle string icon (Material icon)
          let DynamicIcon: any = null;
          if (typeof button.icon === "string") {
            // DynamicIcon = icons[button.icon || ""];
          }

          return (
            <React.Fragment key={button.label}>
              <Button
                key={index}
                onClick={button.onClick}
                variant={button.variant || "outline"}
                size="sm"
                className={cn(button.className, "w-full flex justify-start")}
                disabled={button.disabled}
                style={{
                  display: button.hide ? "none" : undefined,
                }}
              >
                {typeof button.icon === "string" && DynamicIcon ? (
                  <DynamicIcon className="mr-2 h-4 w-4" />
                ) : (
                  <IconRenderer icon={button.icon} className="mr-2 h-4 w-4" />
                )}
                {button.label}
              </Button>
            </React.Fragment>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};
