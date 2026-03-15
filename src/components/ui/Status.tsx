/**
 * Status indicator dot with optional animation.
 * @module components/ui/status
 */

import { cn } from "@/shared";

export interface StatusProps {
  colorPalette?: "green" | "yellow" | "red" | "gray";
  animate?: boolean;
  className?: string;
}

export function Status({
  colorPalette = "gray",
  animate = false,
  className,
}: StatusProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        colorPalette === "green" && "bg-green-500",
        colorPalette === "yellow" && "bg-yellow-500",
        colorPalette === "red" && "bg-red-500",
        colorPalette === "gray" && "bg-gray-500",
        animate && "animate-pulse",
        className
      )}
    />
  );
}
