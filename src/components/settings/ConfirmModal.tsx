/**
 * Reusable confirmation dialog for destructive actions.
 * @module settings/components/ConfirmModal
 */

import { Button } from "@/components/ui/Button";
import {
  DialogRoot,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";

interface ConfirmModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Modal title */
  title: string;
  /** Confirmation message to display */
  message: string;
  /** Label for confirm button (default: "Remove") */
  confirmLabel?: string;
  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Called when user confirms action */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Confirmation dialog with cancel and confirm buttons.
 * Confirm button uses danger variant for destructive actions.
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <DialogRoot open={isOpen} onOpenChange={(open) => !open && onCancel()} size="sm">
      <DialogHeader onClose={onCancel}>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <DialogDescription>{message}</DialogDescription>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button colorPalette="red" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogRoot>
  );
}
