/**
 * Modal for selecting a Home Assistant entity to add to a sensor list.
 * Features search filtering and keyboard navigation.
 * @module settings/components/AddSensorModal
 */

import { useCallback, useState, memo } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from "@/components/ui/Command";
import {
  DialogRoot,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/Dialog";
import { useFilteredEntities } from "@/hooks/useFilteredEntities";
import { useHaStates, useHaConnectionStatus } from "@/hooks/useHaStates";

interface AddSensorModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Section name for modal title (e.g., "Menu Bar") */
  sectionName: string;
  /** Entity IDs to exclude from results (already selected) */
  excludeEntities: string[];
  /** Called when user selects an entity */
  onSelect: (entityId: string) => void;
  /** Called when modal is closed */
  onClose: () => void;
}

/**
 * Modal for selecting a Home Assistant entity to add to a sensor list.
 * Uses Command component for search and keyboard navigation.
 */
const AddSensorModal = memo(function AddSensorModal({
  isOpen,
  sectionName,
  excludeEntities,
  onSelect,
  onClose,
}: AddSensorModalProps) {
  const [query, setQuery] = useState("");
  const [states] = useHaStates();
  const { status } = useHaConnectionStatus();

  const isConnected = status === "connected";
  const filtered = useFilteredEntities(states, excludeEntities, query);

  const handleSelect = useCallback(
    (entityId: string) => {
      onSelect(entityId);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <DialogRoot open={isOpen} onOpenChange={(open) => !open && onClose()} size="lg">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Add sensor to {sectionName}</DialogTitle>
      </DialogHeader>
      <DialogBody className="p-0">
        <Command shouldFilter={false}>
          <CommandInput
            aria-label="Search entities"
            placeholder={
              isConnected ? "Search entities..." : "Connect to HA first"
            }
            disabled={!isConnected}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isConnected ? (
              <>
                <CommandEmpty>No matching entities.</CommandEmpty>
                <CommandGroup>
                  {filtered.slice(0, 100).map((entity) => (
                    <CommandItem
                      key={entity.entityId}
                      value={entity.entityId}
                      onSelect={() => handleSelect(entity.entityId)}
                    >
                      <div className="flex justify-between items-center gap-3 w-full py-1">
                        <div className="flex flex-col items-start flex-1 min-w-0 gap-0">
                          <span className="text-sm">
                            {entity.friendlyName || entity.entityId}
                          </span>
                          {entity.friendlyName && (
                            <span className="text-xs text-fg-muted font-mono truncate">
                              {entity.entityId}
                            </span>
                          )}
                        </div>
                        {entity.currentValue && (
                          <span className="text-sm text-fg-muted font-mono whitespace-nowrap shrink-0">
                            {entity.currentValue}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {filtered.length > 100 && (
                  <p className="text-xs text-fg-muted text-center py-2">
                    Showing first 100 of {filtered.length} entities. Refine your
                    search.
                  </p>
                )}
              </>
            ) : (
              <div className="p-6 text-center">
                <p className="text-fg-muted">
                  Connect to Home Assistant to browse entities.
                </p>
              </div>
            )}
          </CommandList>
        </Command>
      </DialogBody>
    </DialogRoot>
  );
});

export { AddSensorModal };
