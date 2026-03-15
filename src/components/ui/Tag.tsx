/**
 * Tag/Badge component for displaying labels.
 * @module components/ui/tag
 */

import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@/shared";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md";
  variant?: "subtle" | "solid";
  colorPalette?: "default" | "blue" | "green" | "red" | "yellow";
  children: ReactNode;
}

export function Tag({
  size = "md",
  variant = "subtle",
  colorPalette = "default",
  className,
  children,
  ...props
}: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg font-medium",

        // Size
        size === "sm" && "px-1.5 py-0.5 text-xs",
        size === "md" && "px-2 py-1 text-sm",

        // Variant + color combinations
        variant === "subtle" &&
          colorPalette === "default" &&
          "bg-neutral-700 text-neutral-300",
        variant === "subtle" &&
          colorPalette === "blue" &&
          "bg-blue-950/50 text-blue-400",
        variant === "subtle" &&
          colorPalette === "green" &&
          "bg-green-950/50 text-green-400",
        variant === "subtle" &&
          colorPalette === "red" &&
          "bg-red-950/50 text-red-400",
        variant === "subtle" &&
          colorPalette === "yellow" &&
          "bg-yellow-950/50 text-yellow-400",

        variant === "solid" &&
          colorPalette === "default" &&
          "bg-neutral-600 text-white",
        variant === "solid" &&
          colorPalette === "blue" &&
          "bg-blue-600 text-white",
        variant === "solid" &&
          colorPalette === "green" &&
          "bg-green-600 text-white",
        variant === "solid" &&
          colorPalette === "red" &&
          "bg-red-600 text-white",
        variant === "solid" &&
          colorPalette === "yellow" &&
          "bg-yellow-600 text-white",

        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

interface TagLabelProps {
  children: ReactNode;
  className?: string;
}

export function TagLabel({ children, className }: TagLabelProps) {
  return <span className={cn("font-mono", className)}>{children}</span>;
}

interface TagStartElementProps {
  children: ReactNode;
}

export function TagStartElement({ children }: TagStartElementProps) {
  return <span className="flex-shrink-0">{children}</span>;
}
