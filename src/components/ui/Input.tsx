import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/shared";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="control"
      className={cn(
        "flex h-9 w-full rounded-lg border border-border bg-bg-panel px-3 py-1 text-sm transition-colors duration-200",
        "placeholder:text-fg-muted",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
