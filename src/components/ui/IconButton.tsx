import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline" | "ghost";
  colorPalette?: "default" | "red";
  size?: "xs" | "sm" | "md";
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      variant = "ghost",
      colorPalette = "default",
      size = "md",
      className,
      disabled,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled}
        data-slot="control"
        className={cn(
          // Base styles - rounded-full for icon buttons
          "inline-flex items-center justify-center rounded-full transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "disabled:pointer-events-none disabled:opacity-50",

          // Size variants (square)
          size === "xs" && "h-7 w-7",
          size === "sm" && "h-8 w-8",
          size === "md" && "h-9 w-9",

          // Variant + color combinations
          variant === "solid" &&
            colorPalette === "default" &&
            "bg-neutral-600 text-white hover:bg-neutral-500",
          variant === "solid" &&
            colorPalette === "red" &&
            "bg-red-600 text-white hover:bg-red-700",

          variant === "outline" && "border border-border hover:bg-bg-emphasized/60",

          variant === "ghost" && "hover:bg-bg-emphasized/60 text-fg-muted hover:text-fg",
          variant === "ghost" &&
            colorPalette === "red" &&
            "text-red-500 hover:bg-red-950 hover:text-red-400",

          // Cursor for drag handle
          "cursor-pointer",

          className
        )}
        {...props}
      />
    );
  }
);
