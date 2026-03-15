import { Switch as HeadlessSwitch } from "@headlessui/react";
import { cn } from "@/shared";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <HeadlessSwitch
      checked={checked}
      onChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full",
        "border-2 border-transparent transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-green-500" : "bg-neutral-600"
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow",
          "transform transition duration-200",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </HeadlessSwitch>
  );
}
