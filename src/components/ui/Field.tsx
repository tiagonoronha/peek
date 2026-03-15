import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/shared";

interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Field label */
  label?: string;
  /** Helper text below field */
  helperText?: ReactNode;
  /** Error message (shown when invalid) */
  errorText?: string;
  /** Whether field is in error state */
  invalid?: boolean;
  /** Horizontal layout (label and control side by side) */
  orientation?: "vertical" | "horizontal";
  children: ReactNode;
}

export function Field({
  label,
  helperText,
  errorText,
  invalid,
  orientation = "vertical",
  children,
  className,
  ...props
}: FieldProps) {
  if (orientation === "horizontal") {
    return (
      <div
        className={cn("flex items-center justify-between gap-4", className)}
        {...props}
      >
        <div className="flex-1">
          {label && <label className="text-sm font-medium">{label}</label>}
          {helperText && (
            <p className="text-sm text-fg-muted mt-0.5">{helperText}</p>
          )}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && <label className="text-sm font-medium block">{label}</label>}
      {helperText && <p className="text-sm text-fg-muted">{helperText}</p>}
      {children}
      {invalid && errorText && (
        <p className="text-sm text-red-500">{errorText}</p>
      )}
    </div>
  );
}
