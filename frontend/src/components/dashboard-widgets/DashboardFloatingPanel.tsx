import { useCallback, useState } from "react";
import { GripVertical, PanelRightClose, PanelRightOpen, RotateCcw, X } from "lucide-react";
import { useDashboardWidgets } from "@/contexts/DashboardWidgetsContext";
import { WIDGET_LABELS } from "@/contexts/DashboardWidgetsContext";
import { WIDGET_TYPE_DRAG_KEY } from "./DropTargetSlot";

const PANEL_WIDTH = 260;

const WIDGET_ICONS: Record<string, string> = {
  "recent-users": "U",
  "recent-organizations": "O",
  "recent-teams": "T",
  events: "E",
  invitations: "I",
  database: "D",
  "world-map": "W",
};

export function DashboardFloatingPanel() {
  const { widgets, reorderWidgets, removeWidget, addWidget, availableToAdd, slotOverrides, setSlotOverride, resetToDefault, panelExpanded: expanded, setPanelExpanded: setExpanded } =
    useDashboardWidgets();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number, widgetType: string) => {
      e.dataTransfer.effectAllowed = "copyMove";
      e.dataTransfer.setData("text/plain", String(index));
      e.dataTransfer.setData(WIDGET_TYPE_DRAG_KEY, widgetType);
      setDraggedIndex(index);
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTargetIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      setDraggedIndex(null);
      setDropTargetIndex(null);
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (Number.isNaN(fromIndex) || fromIndex === toIndex) return;
      reorderWidgets(fromIndex, toIndex);
    },
    [reorderWidgets],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, []);

  const hasOverrides = Object.keys(slotOverrides).length > 0;

  if (widgets.length === 0 && availableToAdd.length === 0) return null;

  return (
    <div
      className="fixed top-2 right-0 z-30 flex flex-col border-l border-white/10 bg-black/[.97] backdrop-blur-md transition-[width] duration-200 ease-out"
      style={{ width: expanded ? PANEL_WIDTH : 0, height: "100vh" }}
    >
      {/* Toggle tab on the left edge */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="absolute top-3 mt-12 z-10 flex h-8 items-center gap-1 px-1.5 py-1 border border-white/20 bg-black text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-[10px] font-mono uppercase"
        style={{ right: expanded ? PANEL_WIDTH - 1 : -1, borderRight: "none" }}
        title={expanded ? "Collapse panel" : "Expand widgets panel"}
      >
        {expanded ? (
          <PanelRightClose className="w-3.5 h-3.5" />
        ) : (
          <>
            <PanelRightOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Widgets</span>
          </>
        )}
      </button>

      {expanded && (
        <>
          {/* Header */}
          <div className="shrink-0 px-3 pt-3 pb-2 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-mono font-medium text-gray-300 uppercase tracking-wider">
                Widgets
              </h3>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 leading-tight">
              Drag a widget onto any dashboard card to replace it
            </p>
          </div>

          {/* Widget list */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 py-2 space-y-1">
            {widgets.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index, item.widgetType)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-2 px-2 py-2 border transition-all cursor-grab active:cursor-grabbing select-none ${
                  draggedIndex === index
                    ? "opacity-40 border-white/20 bg-white/5"
                    : "border-transparent hover:border-white/10 hover:bg-white/[3%]"
                } ${dropTargetIndex === index ? "border-white/30 bg-white/5" : ""}`}
              >
                <GripVertical className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 shrink-0" />
                <div className="w-6 h-6 flex items-center justify-center bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 shrink-0">
                  {WIDGET_ICONS[item.widgetType] || "?"}
                </div>
                <span className="text-[11px] text-gray-400 group-hover:text-gray-300 truncate flex-1 font-mono">
                  {WIDGET_LABELS[item.widgetType]}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWidget(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-opacity shrink-0"
                  title="Remove widget"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Add widget */}
          {availableToAdd.length > 0 && (
            <div className="shrink-0 px-3 py-2 border-t border-white/10">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    addWidget(val as any, 1);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                className="w-full bg-white/5 border border-white/10 text-gray-400 text-[11px] font-mono px-2 py-1.5 rounded-none focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="">+ Add widget...</option>
                {availableToAdd.map((t) => (
                  <option key={t} value={t}>
                    {WIDGET_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Footer with reset */}
          <div className="shrink-0 px-3 py-2 border-t border-white/10">
            <button
              type="button"
              onClick={resetToDefault}
              className="w-full text-[10px] font-mono text-gray-500 hover:text-gray-300 py-1 transition-colors"
            >
              Reset widgets to default
            </button>
          </div>
        </>
      )}
    </div>
  );
}
