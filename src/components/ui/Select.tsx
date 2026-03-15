/**
 * Native select component styled with Tailwind.
 * @module components/ui/Select
 */

import { ChevronDown } from "lucide-react";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/shared";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative inline-flex">
        <select
          ref={ref}
          data-slot="control"
          className={cn(
            "flex h-9 w-full appearance-none rounded-lg border border-border bg-bg-panel",
            "px-3 py-1 pr-9 text-sm transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted pointer-events-none"
        />
      </div>
    );
  }
);
