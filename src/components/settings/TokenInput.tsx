/**
 * Secure token input with masked display and replace functionality.
 * Shows masked value when token exists, with option to clear and enter new token.
 * @module settings/components/TokenInput
 */

import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toaster";
import { onSettingsChanged } from "@/services/appLifecycle";
import { saveSettings } from "@/services/configStore";
import { disconnect } from "@/services/haConnection";

interface TokenInputProps {
  /** Current token value */
  value: string;
  /** Called when user enters a new token */
  onChange: (value: string) => void;
  /** Called when token is cleared */
  onClear: () => void;
  /** Disable input and replace button */
  disabled?: boolean;
}

/**
 * Token input that shows masked value when token exists.
 * Clearing token disconnects from HA and persists immediately.
 */
export function TokenInput({
  value,
  onChange,
  onClear,
  disabled,
}: TokenInputProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const hasExistingToken = !!value;

  const handleReplaceToken = async () => {
    setShowConfirm(false);
    try {
      // Disconnect immediately when user chooses to replace token
      disconnect();

      // Clear the token and save immediately
      await saveSettings({ haToken: "" });
      onClear();
      await onSettingsChanged();

      toast.success("Token cleared. Enter a new token.");
    } catch (err) {
      toast.error(`Error clearing token: ${err}`);
    }
  };

  return (
    <Field
      label="Long-lived access token"
      helperText={
        <>
          Found in your{" "}
          <a
            href="https://www.home-assistant.io/docs/authentication/#your-account-profile"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Home Assistant profile
          </a>{" "}
          under Long-Lived Access Tokens.
        </>
      }
    >
      {hasExistingToken ? (
        <>
          <Input
            type="password"
            value="••••••••••••••••"
            disabled
            className="opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={disabled}
            className="self-start p-0 h-auto text-sm text-red-500 underline hover:no-underline disabled:opacity-50"
          >
            Replace token
          </button>
          <ConfirmModal
            isOpen={showConfirm}
            title="Replace token?"
            message="This will disconnect from Home Assistant. You'll need to enter a new token to reconnect."
            confirmLabel="Replace"
            onConfirm={handleReplaceToken}
            onCancel={() => setShowConfirm(false)}
          />
        </>
      ) : (
        <Input
          type="password"
          placeholder="Paste your token"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </Field>
  );
}
