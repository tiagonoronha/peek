/**
 * Visual separator/divider component.
 * @module components/ui/separator
 */

import { cn } from "@/shared";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Separator({
  orientation = "horizontal",
  className,
}: SeparatorProps) {
  return (
    <div
      role="separator"
      className={cn(
        "bg-border-subtle shrink-0",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
    />
  );
}
