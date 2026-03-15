/**
 * Hook for inline editable text functionality.
 * Replaces Chakra UI's useEditable hook.
 * @module hooks/useEditable
 */

import { useState, useCallback, useRef, useEffect } from "react";

interface UseEditableOptions {
  /** Current value */
  value: string;
  /** Placeholder text when value is empty */
  placeholder?: string;
  /** Called when value changes during editing */
  onValueChange?: (details: { value: string }) => void;
  /** Called when editing is committed (blur or Enter) */
  onValueCommit?: (details: { value: string }) => void;
  /** Called when editing is cancelled (Escape) */
  onValueRevert?: () => void;
}

interface UseEditableReturn {
  /** Whether currently in edit mode */
  isEditing: boolean;
  /** Current edit value */
  value: string;
  /** Enter edit mode */
  edit: () => void;
  /** Cancel editing and revert to original value */
  cancel: () => void;
  /** Commit the current edit value */
  submit: () => void;
  /** Update the edit value */
  setValue: (value: string) => void;
  /** Ref to attach to the input element */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Props to spread on the preview element */
  previewProps: {
    onClick: () => void;
    tabIndex: number;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
  /** Props to spread on the input element */
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}

/**
 * Hook for inline editing with commit/revert support and keyboard handling.
 *
 * @param root0 - Editable options
 * @param root0.value - Current value to edit
 * @param root0.onValueChange - Called when value changes during editing
 * @param root0.onValueCommit - Called when editing is committed (blur or Enter)
 * @param root0.onValueRevert - Called when editing is cancelled (Escape)
 */
export function useEditable({
  value: initialValue,
  onValueChange,
  onValueCommit,
  onValueRevert,
}: UseEditableOptions): UseEditableReturn {
  const [isEditing, setIsEditing] = useState(false);
  // Only store local edits; when not editing, we use initialValue directly
  const [localEditValue, setLocalEditValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // The displayed value: use local edit value when editing, otherwise use prop
  const editValue = isEditing ? localEditValue : initialValue;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const edit = useCallback(() => {
    setLocalEditValue(initialValue);
    setIsEditing(true);
  }, [initialValue]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    onValueRevert?.();
  }, [onValueRevert]);

  const submit = useCallback(() => {
    setIsEditing(false);
    onValueCommit?.({ value: localEditValue });
  }, [localEditValue, onValueCommit]);

  const setValue = useCallback(
    (value: string) => {
      setLocalEditValue(value);
      onValueChange?.({ value });
    },
    [onValueChange]
  );

  const previewProps = {
    onClick: edit,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        edit();
      }
    },
  };

  const inputProps = {
    ref: inputRef,
    value: editValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    onBlur: submit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    },
  };

  return {
    isEditing,
    value: editValue,
    edit,
    cancel,
    submit,
    setValue,
    inputRef,
    previewProps,
    inputProps,
  };
}
