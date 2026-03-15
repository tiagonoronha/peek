/**
 * Dialog component using Headless UI.
 * @module components/ui/Dialog
 */

import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle as HeadlessDialogTitle,
} from "@headlessui/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared";

interface DialogRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function DialogRoot({
  open,
  onOpenChange,
  size = "md",
  children,
}: DialogRootProps) {
  return (
    <HeadlessDialog
      open={open}
      onClose={() => onOpenChange(false)}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

      {/* Positioner */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={cn(
            "w-full rounded-3xl bg-bg-panel shadow-2xl",
            size === "sm" && "max-w-sm",
            size === "md" && "max-w-md",
            size === "lg" && "max-w-lg"
          )}
        >
          {children}
        </DialogPanel>
      </div>
    </HeadlessDialog>
  );
}

interface DialogHeaderProps {
  children: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function DialogHeader({
  children,
  showCloseButton = true,
  onClose,
}: DialogHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
      {children}
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="text-fg-muted hover:text-fg transition-colors duration-200 rounded-full p-1 hover:bg-bg-emphasized/60"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <HeadlessDialogTitle className={cn("text-lg font-semibold", className)}>
      {children}
    </HeadlessDialogTitle>
  );
}

interface DialogBodyProps {
  children: ReactNode;
  className?: string;
}

export function DialogBody({ children, className }: DialogBodyProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function DialogDescription({
  children,
  className,
}: DialogDescriptionProps) {
  return <p className={cn("text-sm text-fg-muted", className)}>{children}</p>;
}

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "flex justify-end gap-3 px-6 py-4 border-t border-border-subtle",
        className
      )}
    >
      {children}
    </div>
  );
}

