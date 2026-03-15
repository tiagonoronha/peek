/**
 * Reusable sensor list section component.
 * Supports add, remove, reorder, and configure actions with auto-save.
 * @module settings/SensorSection
 */

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useState, useCallback, memo } from "react";
import { AddSensorModal } from "./AddSensorModal";
import { ConfirmModal } from "./ConfirmModal";
import { SensorListItem } from "./SensorListItem";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
} from "@/components/ui/Card";
import { SortableItem } from "@/components/ui/Sortable";
import { useAutoSaveSettings } from "@/hooks/useAutoSaveField";
import { useHaStates } from "@/hooks/useHaStates";
import {
  addSensor,
  removeSensor,
  cleanupSensorName,
  cn,
  getSensorDisplayInfo,
} from "@/shared";

/** Key for accessing sensor list in Settings */
export type SensorListKey = "menuBarSensors" | "dropdownSensors";

/** Key for accessing sensor names in Settings */
export type SensorNamesKey = "menuBarSensorNames" | "dropdownSensorNames";

/** Maps each sensor list key to its corresponding names key */
export const sensorNamesKeyMap: Record<SensorListKey, SensorNamesKey> = {
  menuBarSensors: "menuBarSensorNames",
  dropdownSensors: "dropdownSensorNames",
};

/** Human-readable names for accessibility announcements */
export const listNames: Record<SensorListKey, string> = {
  menuBarSensors: "menu bar sensors",
  dropdownSensors: "dropdown sensors",
};

export interface SensorSectionProps {
  /** Section heading */
  title: string;
  /** Section description */
  description: string;
  /** Settings key for this sensor list */
  listKey: SensorListKey;
  /** Whether a drag is currently over this container */
  isOverContainer: boolean;
}

/**
 * Reusable sensor list section with add, remove, reorder, and configure actions.
 * Uses auto-save pattern (changes persisted immediately).
 * DndContext is managed by parent SensorsTab for cross-list drag support.
 */
export const SensorSection = memo(function SensorSection({
  title,
  description,
  listKey,
  isOverContainer,
}: SensorSectionProps) {
  const { settings, savePartial } = useAutoSaveSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [sensorToRemove, setSensorToRemove] = useState<{
    entityId: string;
    displayName: string;
  } | null>(null);
  const [states] = useHaStates();

  const sensorList = settings[listKey];
  const namesKey = sensorNamesKeyMap[listKey];
  const sensorNames = settings[namesKey];

  // Make this section a droppable container for cross-list drops
  const { setNodeRef } = useDroppable({ id: listKey });

  const handleAdd = useCallback(
    (entityId: string) => {
      const updated = addSensor(sensorList, entityId);
      if (updated !== sensorList) {
        savePartial({ [listKey]: updated });
      }
      setIsModalOpen(false);
    },
    [sensorList, listKey, savePartial]
  );

  const handleRemove = useCallback(
    (entityId: string) => {
      const updated = removeSensor(sensorList, entityId);
      const names = cleanupSensorName(sensorNames, entityId);
      savePartial({
        [listKey]: updated,
        [namesKey]: names,
      });
    },
    [sensorList, sensorNames, listKey, namesKey, savePartial]
  );

  const handleConfirmRemove = useCallback(() => {
    if (sensorToRemove) {
      handleRemove(sensorToRemove.entityId);
      setSensorToRemove(null);
    }
  }, [sensorToRemove, handleRemove]);

  const handleNameChange = useCallback(
    (entityId: string, name: string) => {
      const names = { ...sensorNames };
      if (name) {
        names[entityId] = name;
      } else {
        delete names[entityId];
      }
      savePartial({ [namesKey]: names });
    },
    [sensorNames, namesKey, savePartial]
  );

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "transition-all duration-150",
        isOverContainer && "border-2 border-dashed border-blue-500"
      )}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardBody>
        <div>
          {sensorList.length === 0 ? (
            <p className="text-fg-muted text-sm py-2 mb-4 italic">
              {isOverContainer
                ? "Drop here to add sensor"
                : "No sensors added yet."}
            </p>
          ) : (
            <SortableContext
              items={sensorList}
              strategy={verticalListSortingStrategy}
            >
              <ul className="list-none m-0 p-0 mb-4 space-y-3">
                {sensorList.map((entityId) => {
                  const { originalName, customName, sensorValue } =
                    getSensorDisplayInfo(entityId, states.get(entityId), sensorNames);

                  return (
                    <SortableItem
                      key={entityId}
                      id={entityId}
                      containerId={listKey}
                    >
                      {({ setNodeRef, dragHandleProps, isDragging }) => (
                        <SensorListItem
                          ref={setNodeRef}
                          entityId={entityId}
                          originalName={originalName}
                          customName={customName}
                          sensorValue={sensorValue}
                          onNameChange={(name) =>
                            handleNameChange(entityId, name)
                          }
                          onRemove={() =>
                            setSensorToRemove({
                              entityId,
                              displayName: customName || originalName,
                            })
                          }
                          dragHandleProps={dragHandleProps}
                          isDragging={isDragging}
                        />
                      )}
                    </SortableItem>
                  );
                })}
              </ul>
            </SortableContext>
          )}

          <Button
            variant="outline"
            onClick={() => {
              setModalKey((k) => k + 1);
              setIsModalOpen(true);
            }}
            className="w-full border-dashed"
          >
            <Plus size={16} />
            Add sensor
          </Button>
        </div>
      </CardBody>

      <AddSensorModal
        key={modalKey}
        isOpen={isModalOpen}
        sectionName={title}
        excludeEntities={sensorList}
        onSelect={handleAdd}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmModal
        isOpen={sensorToRemove !== null}
        title="Remove sensor"
        message={`Are you sure you want to remove "${sensorToRemove?.displayName}" from the list?`}
        onConfirm={handleConfirmRemove}
        onCancel={() => setSensorToRemove(null)}
      />
    </Card>
  );
});
