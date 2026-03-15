import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with conflict resolution via clsx + tailwind-merge.
 *
 * @param inputs - Class values to merge (strings, arrays, objects, etc.)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
