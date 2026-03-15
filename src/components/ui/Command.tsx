/**
 * Command palette component using cmdk with Tailwind styling.
 * @module components/ui/Command
 */

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import * as React from "react";
import { cn } from "@/shared";

function Command({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive {...props}>
      <div className={cn("flex h-full w-full flex-col", className)}>
        {children}
      </div>
    </CommandPrimitive>
  );
}

function CommandInput({
  disabled,
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="px-6 py-4">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
        />
        <CommandPrimitive.Input
          disabled={disabled}
          className={cn(
            "flex h-9 w-full rounded-lg border border-border bg-bg-panel",
            "pl-9 pr-3 py-1 text-sm transition-colors duration-200",
            "placeholder:text-fg-muted",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder="Search..."
          {...props}
        />
      </div>
    </div>
  );
}

function CommandList({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List {...props}>
      <div
        className={cn(
          "max-h-[300px] overflow-x-hidden overflow-y-auto px-6 pb-4",
          className
        )}
        role="listbox"
      >
        {children}
      </div>
    </CommandPrimitive.List>
  );
}

function CommandEmpty({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty {...props}>
      <div className={cn("py-6 text-center text-sm text-fg-muted", className)}>
        {children}
      </div>
    </CommandPrimitive.Empty>
  );
}

function CommandGroup({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group {...props}>
      <div className={cn("overflow-hidden", className)}>{children}</div>
    </CommandPrimitive.Group>
  );
}

function CommandItem({
  children,
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2",
        "rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-200",
        "hover:bg-neutral-600/60",
        "data-[selected=true]:bg-bg-emphasized",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className
      )}
      role="option"
      {...props}
    >
      {children}
    </CommandPrimitive.Item>
  );
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
};
