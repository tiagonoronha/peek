/**
 * Drag overlay component for sensor list items.
 * Renders a visual copy of the sensor item being dragged.
 * @module settings/DragOverlaySensorItem
 */

import { Activity, Grip, Hash } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Tag, TagLabel, TagStartElement } from "@/components/ui/Tag";
import { useHaStates } from "@/hooks/useHaStates";
import { getSensorDisplayInfo } from "@/shared";

interface DragOverlaySensorItemProps {
  entityId: string;
  sensorNames: Record<string, string>;
}

/**
 * Drag overlay component - renders a visual copy of the sensor item being dragged.
 */
export function DragOverlaySensorItem({
  entityId,
  sensorNames,
}: DragOverlaySensorItemProps) {
  const [states] = useHaStates();
  const { originalName, customName, sensorValue } = getSensorDisplayInfo(
    entityId,
    states.get(entityId),
    sensorNames
  );

  return (
    <div className="flex items-center gap-2 px-4 py-4 rounded-xl border border-border bg-bg-panel shadow-2xl cursor-grabbing">
      {/* Content */}
      <div className="flex flex-col items-start flex-1 gap-1.5 min-w-0">
        <span className="font-medium text-sm">
          {customName || <span className="text-fg-muted">{originalName}</span>}
        </span>
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
      {/* Action controls (visual only) */}
      <div className="flex gap-0">
        <IconButton aria-label="Drag handle" variant="ghost" size="xs">
          <Grip size={16} />
        </IconButton>
      </div>
    </div>
  );
}
