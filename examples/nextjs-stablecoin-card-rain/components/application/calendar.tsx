"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CalendarProps = React.ComponentProps<"input"> & {
  containerClassName?: string;
};

const Calendar = React.forwardRef<HTMLInputElement, CalendarProps>(
  ({ className, containerClassName, onChange, ...props }, ref) => {
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (value) {
        const [year, month, day] = value.split("-");
        // Limit year to 4 digits maximum
        if (year && year.length > 4) {
          const limitedYear = year.slice(0, 4);
          const newValue = `${limitedYear}-${month}-${day}`;
          e.target.value = newValue;
        }
      }
      if (onChange) onChange(e);
    };

    return (
      <div className={cn("relative", containerClassName)}>
        <Input
          type="date"
          ref={ref}
          className={cn("hide-native-calendar pr-10", className)}
          onChange={handleDateChange}
          {...props}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(e) => {
            const input =
              (e.currentTarget.previousElementSibling as HTMLInputElement) ||
              null;
            input?.showPicker?.();
            input?.focus();
          }}
          aria-label="Open date picker"
        >
          <CalendarIcon className="size-4" />
        </button>
      </div>
    );
  }
);
Calendar.displayName = "Calendar";

export { Calendar };
