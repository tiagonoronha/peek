/**
 * Tabbed navigation for settings UI.
 * @module SettingsTabs
 */

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { AboutTab } from "@/components/settings/tabs/AboutTab";
import { AppearanceTab } from "@/components/settings/tabs/AppearanceTab";
import { GeneralTab } from "@/components/settings/tabs/GeneralTab";
import { SensorsTab } from "@/components/settings/tabs/SensorsTab";
import { cn } from "@/shared";

/** Available settings tabs */
const TABS = [
  { id: "general", label: "General", Component: GeneralTab },
  { id: "sensors", label: "Sensors", Component: SensorsTab },
  { id: "appearance", label: "Appearance", Component: AppearanceTab },
  { id: "about", label: "About", Component: AboutTab },
] as const;

type SettingsTabsProps = {
  activeTabIndex: number;
  onTabChange: (index: number) => void;
};

export function SettingsTabs({ activeTabIndex, onTabChange }: SettingsTabsProps) {
  return (
    <TabGroup
      selectedIndex={activeTabIndex}
      onChange={onTabChange}
      className="flex flex-1 flex-col min-h-0"
    >
      <div className="shrink-0 px-6 pt-6 pb-6">
        <TabList className="flex gap-1 rounded-full bg-bg-panel p-1">
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                cn(
                  "flex-1 px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 cursor-pointer",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                  selected
                    ? "bg-bg-emphasized text-white"
                    : "text-fg-muted hover:text-fg"
                )
              }
            >
              {tab.label}
            </Tab>
          ))}
        </TabList>
      </div>

      <TabPanels
        as="main"
        aria-label="Settings"
        className="flex-1 overflow-y-auto px-6 pb-6"
      >
        {TABS.map((tab) => (
          <TabPanel key={tab.id} className="space-y-6 outline-none">
            <tab.Component />
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}
