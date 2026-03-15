/**
 * Appearance settings tab for menu bar and dropdown format templates.
 * @module settings/tabs/AppearanceTab
 */

import { FormatInput } from "@/components/settings/FormatInput";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
} from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Separator } from "@/components/ui/Separator";
import { useAutoSaveField } from "@/hooks/useAutoSaveField";
import { applyFormat } from "@/services/tray";
import { SEPARATOR_OPTIONS } from "@/shared/constants";

/** Reusable description for format template inputs */
const formatDescription = (
  <>
    Use{" "}
    <code className="text-xs bg-neutral-800 px-1 py-0.5 rounded-lg">
      {"{name}"}
    </code>{" "}
    for the sensor name and{" "}
    <code className="text-xs bg-neutral-800 px-1 py-0.5 rounded-lg">
      {"{value}"}
    </code>{" "}
    for the value.
  </>
);

/**
 * Tab for configuring appearance preferences.
 * Includes menu bar icon visibility, separator, and format templates.
 * Uses auto-save pattern with immediate save for toggles and debounced save for text.
 */
export function AppearanceTab() {
  const { value: menuBarSeparator, onChange: setMenuBarSeparator } =
    useAutoSaveField({ field: "menuBarSeparator", debounce: 0 });
  const { value: menuBarFormat, onChange: setMenuBarFormat } = useAutoSaveField(
    { field: "menuBarFormat", debounce: 500 }
  );
  const { value: dropdownFormat, onChange: setDropdownFormat } =
    useAutoSaveField({ field: "dropdownFormat", debounce: 500 });

  return (
    <>
      {/* Menu Bar Card */}
      <Card>
        <CardHeader>
          <CardTitle>Menu bar</CardTitle>
          <CardDescription>
            Customize how sensors appear in your menu bar.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            <Field
              label="Sensor separator"
              helperText="Character displayed between sensors in the menu bar."
            >
              <Select
                aria-label="Sensor separator"
                value={menuBarSeparator}
                onChange={(e) => setMenuBarSeparator(e.target.value)}
                className="w-44"
              >
                {SEPARATOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Separator />

            <FormatInput
              label="Display format"
              description={<>Format for sensors shown in the menu bar. {formatDescription}</>}
              value={menuBarFormat}
              onChange={setMenuBarFormat}
              placeholder="{value}"
              previewFn={(f) => applyFormat(f, "Living Room", "22°C")}
            />
          </div>
        </CardBody>
      </Card>

      {/* Dropdown Menu Card */}
      <Card>
        <CardHeader>
          <CardTitle>Dropdown menu</CardTitle>
          <CardDescription>
            Customize how sensors appear in the dropdown menu.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <FormatInput
            label="Display format"
            description={<>Format for sensors shown in the dropdown. {formatDescription}</>}
            value={dropdownFormat}
            onChange={setDropdownFormat}
            placeholder="{name}: {value}"
            previewFn={(f) => applyFormat(f, "Living Room", "22°C")}
          />
        </CardBody>
      </Card>
    </>
  );
}
