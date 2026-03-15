/**
 * Reusable sortable item wrapper for dnd-kit.
 * @module components/ui/Sortable
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as React from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

/** Props passed to the drag handle element */
export interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
}

interface SortableItemRenderProps {
  /** Ref to attach to the sortable element */
  setNodeRef: (node: HTMLElement | null) => void;
  /** Props to spread on the drag handle */
  dragHandleProps: DragHandleProps;
  /** Whether the item is currently being dragged */
  isDragging: boolean;
}

interface SortableItemProps {
  /** Unique identifier for this sortable item */
  id: string;
  /** Container ID for cross-list drag detection */
  containerId?: string;
  /** Render function receiving sortable props */
  children: (props: SortableItemRenderProps) => React.ReactNode;
}

/**
 * Generic wrapper for making items sortable with dnd-kit.
 * Uses render props pattern for flexibility.
 */
export function SortableItem({ id, containerId, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: containerId ? { sortable: { containerId } } : undefined,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div style={style}>
      {children({
        setNodeRef,
        dragHandleProps: { attributes, listeners },
        isDragging,
      })}
    </div>
  );
}
