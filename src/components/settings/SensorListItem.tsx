/**
 * Individual sensor list item with drag handle and action controls.
 * @module settings/components/SensorListItem
 */

import { Activity, Grip, Hash, Pencil, Trash2 } from "lucide-react";
import { forwardRef, memo } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { IconButton } from "@/components/ui/IconButton";
import { Tag, TagLabel, TagStartElement } from "@/components/ui/Tag";
import { useEditable } from "@/hooks/useEditable";
import { cn } from "@/shared";

/** Props for drag handle from useSortable hook */
interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
}

interface SensorListItemProps {
  /** Entity ID (e.g., "sensor.temperature") */
  entityId: string;
  /** Original name from Home Assistant (used as placeholder) */
  originalName: string;
  /** Custom display name (empty string = use original) */
  customName: string;
  /** Current sensor value with unit */
  sensorValue: string;
  /** Callback when display name is changed */
  onNameChange: (name: string) => void;
  /** Callback when remove button is clicked */
  onRemove: () => void;
  /** Drag handle props from useSortable */
  dragHandleProps?: DragHandleProps;
  /** Whether this item is currently being dragged */
  isDragging?: boolean;
}

/**
 * Sensor list item with drag handle, inline editable name, and remove button.
 * Parent component is responsible for showing confirmation before removal.
 */
const SensorListItem = memo(
  forwardRef<HTMLLIElement, SensorListItemProps>(function SensorListItem(
    {
      entityId,
      originalName,
      customName,
      sensorValue,
      onNameChange,
      onRemove,
      dragHandleProps,
      isDragging,
    },
    ref
  ) {
    const editable = useEditable({
      value: customName,
      placeholder: originalName,
      onValueCommit: (details) => {
        const newValue = details.value.trim();
        if (newValue !== customName) {
          onNameChange(newValue);
        }
      },
    });

    return (
      <li
        ref={ref}
        className={cn("list-none", isDragging && "opacity-50")}
      >
        <div className="flex items-center gap-2 px-4 py-4 rounded-xl border border-border bg-bg-panel">
          {/* Content */}
          <div className="flex flex-col items-start flex-1 gap-1.5 min-w-0">
            {/* Editable name */}
            {editable.isEditing ? (
              <input
                {...editable.inputProps}
                aria-label="Edit sensor display name"
                className="font-medium text-sm bg-bg-emphasized/50 rounded-lg px-2 py-1 -ml-2 border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full transition-colors duration-200"
              />
            ) : (
              <span
                {...editable.previewProps}
                aria-label={`Sensor name: ${editable.value || originalName}`}
                className="font-medium text-sm cursor-pointer hover:text-fg-muted transition-colors duration-200"
              >
                {editable.value || (
                  <span className="text-fg-muted">{originalName}</span>
                )}
              </span>
            )}

            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              <Tag size="sm" variant="subtle" colorPalette="blue">
                <TagStartElement>
                  <Hash size={12} />
                </TagStartElement>
                <TagLabel>{entityId}</TagLabel>
              </Tag>
              <Tag size="sm" variant="subtle" colorPalette="green">
                <TagStartElement>
                  <Activity size={12} />
                </TagStartElement>
                <TagLabel>{sensorValue}</TagLabel>
              </Tag>
            </div>
          </div>

          {/* Action controls */}
          <div className="flex gap-0">
            <IconButton
              aria-label="Drag to reorder"
              variant="ghost"
              size="xs"
              className="cursor-grab active:cursor-grabbing"
              {...dragHandleProps?.attributes}
              {...dragHandleProps?.listeners}
            >
              <Grip size={16} />
            </IconButton>
            <IconButton
              aria-label="Edit sensor name"
              variant="ghost"
              size="xs"
              onClick={() => editable.edit()}
            >
              <Pencil size={14} />
            </IconButton>
            <IconButton
              aria-label="Remove sensor"
              variant="ghost"
              size="xs"
              onClick={onRemove}
            >
              <Trash2 size={14} />
            </IconButton>
          </div>
        </div>
      </li>
    );
  })
);

export { SensorListItem };
