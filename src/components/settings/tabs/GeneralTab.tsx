/**
 * General settings tab for Home Assistant connection and app startup settings.
 * @module settings/tabs/GeneralTab
 */

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { isWebUri } from "valid-url";
import { ConnectionStatus } from "@/components/settings/ConnectionStatus";
import { TokenInput } from "@/components/settings/TokenInput";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
} from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useAutoSaveField } from "@/hooks/useAutoSaveField";
import { useHaConnectionStatus } from "@/hooks/useHaStates";
import { cn } from "@/shared";

/**
 * Tab for configuring general app settings including Home Assistant connection
 * and startup preferences. Uses auto-save pattern with debouncing for text inputs.
 */
export function GeneralTab() {
  const { value: haUrl, onChange: setHaUrl } = useAutoSaveField({
    field: "haUrl",
    debounce: 500,
  });
  const { value: haToken, onChange: setHaToken } = useAutoSaveField({
    field: "haToken",
    debounce: 500,
  });
  const { value: autoStartOnLogin, onChange: setAutoStartOnLogin } =
    useAutoSaveField({ field: "autoStartOnLogin", debounce: 0 });

  const { status } = useHaConnectionStatus();
  const isConnected = status === "connected";
  const urlValid = !haUrl || !!isWebUri(haUrl);

  const connectionFields = (
    <>
      <Field
        label="Server URL"
        helperText="The URL to your Home Assistant instance, including port if needed."
        invalid={!urlValid}
        errorText="Enter a valid URL (e.g., https://homeassistant.local:8123)"
      >
        <Input
          type="url"
          value={haUrl}
          onChange={(e) => setHaUrl(e.target.value)}
          placeholder="https://homeassistant.local:8123"
        />
      </Field>
      <TokenInput
        value={haToken}
        onChange={setHaToken}
        onClear={() => setHaToken("")}
      />
    </>
  );

  return (
    <>
      {/* Home Assistant Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Home Assistant</CardTitle>
          <CardDescription>
            Configure your Home Assistant server connection.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            <ConnectionStatus />

            {isConnected ? (
              <Disclosure>
                {({ open }) => (
                  <>
                    <DisclosureButton className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer hover:text-white transition-colors duration-200">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          open && "rotate-180"
                        )}
                      />
                      Connection settings
                    </DisclosureButton>
                    <DisclosurePanel className="space-y-6 mt-4">
                      {connectionFields}
                    </DisclosurePanel>
                  </>
                )}
              </Disclosure>
            ) : (
              <>
                {connectionFields}
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* System Card */}
      <Card>
        <CardHeader>
          <CardTitle>System</CardTitle>
          <CardDescription>
            Control how the application integrates with your operating system.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Field
            label="Start at login"
            helperText="Automatically launch the application when you log in."
            orientation="horizontal"
          >
            <Switch
              aria-label="Start at login"
              checked={autoStartOnLogin}
              onCheckedChange={setAutoStartOnLogin}
            />
          </Field>
        </CardBody>
      </Card>
    </>
  );
}
