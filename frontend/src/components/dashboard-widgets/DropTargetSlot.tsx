import { type ReactNode, useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { OverviewSlotId, WidgetType } from "@/contexts/DashboardWidgetsContext";
import { WIDGET_LABELS, useDashboardWidgets } from "@/contexts/DashboardWidgetsContext";

export const WIDGET_TYPE_DRAG_KEY = "application/x-dashboard-widget-type";

const VALID_WIDGET_TYPES = new Set<string>([
  "events",
  "database",
  "invitations",
  "recent-users",
  "recent-organizations",
  "recent-teams",
  "world-map",
]);

interface DropTargetSlotProps {
  slotId: OverviewSlotId;
  children: ReactNode;
  className?: string;
}

export function DropTargetSlot({ slotId, children, className = "" }: DropTargetSlotProps) {
  const { slotOverrides, setSlotOverride } = useDashboardWidgets();
  const [isDragOver, setIsDragOver] = useState(false);
  const override = slotOverrides[slotId];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(WIDGET_TYPE_DRAG_KEY)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const widgetType = e.dataTransfer.getData(WIDGET_TYPE_DRAG_KEY);
      if (widgetType && VALID_WIDGET_TYPES.has(widgetType)) {
        setSlotOverride(slotId, widgetType as WidgetType);
      }
    },
    [slotId, setSlotOverride],
  );

  return (
    <div
      className={`relative transition-all duration-150 overflow-hidden ${className} ${
        isDragOver ? "ring-1 ring-white/40 ring-offset-1 ring-offset-black bg-white/[3%]" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {override && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSlotOverride(slotId, null);
          }}
          className="absolute top-3 right-3 z-20 flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase text-gray-600 hover:text-white bg-black/80 border border-white/10 hover:border-white/30 backdrop-blur-sm transition-all"
          title={`Restore original card (currently: ${WIDGET_LABELS[override] ?? override})`}
        >
          <RotateCcw className="w-2.5 h-2.5" />
          restore
        </button>
      )}

      {isDragOver && !override && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 border border-dashed border-white/30 pointer-events-none">
          <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">
            Drop to replace
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
