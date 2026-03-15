import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline" | "ghost" | "plain";
  colorPalette?: "default" | "red" | "blue" | "green";
  size?: "xs" | "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "solid",
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
          // Base styles
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",

          // Size variants
          size === "xs" && "h-7 px-2 text-xs",
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-9 px-4 text-sm",

          // Variant + color combinations
          variant === "solid" &&
            colorPalette === "default" &&
            "bg-neutral-600 text-white hover:bg-neutral-500",
          variant === "solid" &&
            colorPalette === "red" &&
            "bg-red-600 text-white hover:bg-red-700",
          variant === "solid" &&
            colorPalette === "blue" &&
            "bg-blue-600 text-white hover:bg-blue-700",
          variant === "solid" &&
            colorPalette === "green" &&
            "bg-green-600 text-white hover:bg-green-700",

          variant === "outline" && "border border-border hover:bg-bg-emphasized/60",
          variant === "outline" &&
            colorPalette === "red" &&
            "border-red-600 text-red-500 hover:bg-red-950",

          variant === "ghost" && "hover:bg-bg-emphasized/60",
          variant === "ghost" &&
            colorPalette === "red" &&
            "text-red-500 hover:bg-red-950 hover:text-red-400",

          variant === "plain" && "underline hover:no-underline",
          variant === "plain" && colorPalette === "red" && "text-red-500",

          className
        )}
        {...props}
      />
    );
  }
);
