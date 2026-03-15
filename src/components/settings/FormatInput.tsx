/**
 * Format template input with live preview.
 * @module settings/components/FormatInput
 */

import type { ReactNode } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

interface FormatInputProps {
  /** Field label */
  label: string;
  /** Optional field description */
  description?: ReactNode;
  /** Current format template value */
  value: string;
  /** Called when format changes */
  onChange: (value: string) => void;
  /** Input placeholder text */
  placeholder?: string;
  /** Function to generate preview from format */
  previewFn: (format: string) => string;
  /** Disable input */
  disabled?: boolean;
}

/**
 * Format template input with live preview.
 * Shows how the format will render with sample data.
 */
export function FormatInput({
  label,
  description,
  value,
  onChange,
  placeholder,
  previewFn,
  disabled,
}: FormatInputProps) {
  const preview = previewFn(value);

  return (
    <Field label={label} helperText={description}>
      <Input
        type="text"
        className="w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <p className="text-sm text-fg-muted italic">Preview: {preview}</p>
    </Field>
  );
}
