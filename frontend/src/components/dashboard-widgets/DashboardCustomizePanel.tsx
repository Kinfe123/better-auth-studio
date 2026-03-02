import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "../PixelIcons";
import {
  useDashboardWidgets,
  WIDGET_LABELS,
  type WidgetType,
} from "@/contexts/DashboardWidgetsContext";

export function DashboardCustomizePanel() {
  const { widgets, addWidget, availableToAdd, resetToDefault, setCustomizing, removeWidget } =
    useDashboardWidgets();
  const [addingType, setAddingType] = useState<WidgetType | "">("");
  const [replaceId, setReplaceId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!addingType) return;
    if (replaceId) {
      removeWidget(replaceId);
      setReplaceId(null);
    }
    addWidget(addingType as WidgetType, 1);
    setAddingType("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-black border border-white/10 w-full max-h-[85vh] md:max-w-lg md:max-h-[80vh] rounded-none flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-light text-white">Customize dashboard</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCustomizing(false)}
            className="text-gray-400 hover:text-white rounded-none"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-mono mb-2">Add widget</p>
            <p className="text-sm text-gray-500 mb-2">
              To add a widget, choose one to remove and the new widget type to add.
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={replaceId ?? ""}
                onChange={(e) => setReplaceId(e.target.value || null)}
                className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-white/30"
              >
                <option value="">Remove which widget?</option>
                {widgets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {WIDGET_LABELS[w.widgetType]} (remove)
                  </option>
                ))}
              </select>
              <select
                value={addingType}
                onChange={(e) => setAddingType(e.target.value as WidgetType | "")}
                className="bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-white/30"
              >
                <option value="">Add which widget?</option>
                {availableToAdd.map((t) => (
                  <option key={t} value={t}>
                    {WIDGET_LABELS[t]}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAdd}
                disabled={!addingType || !replaceId}
                className="rounded-none"
              >
                Replace
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-mono mb-2">Current widgets</p>
            <ul className="space-y-1 text-sm text-gray-300">
              {widgets.map((w) => (
                <li key={w.id} className="flex justify-between items-center">
                  {WIDGET_LABELS[w.widgetType]}
                  <span className="text-gray-500 text-xs">{w.width} col(s)</span>
                </li>
              ))}
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={resetToDefault}
            className="w-full border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-none"
          >
            Reset to default layout
          </Button>
        </div>
        <div className="p-4 border-t border-white/10">
          <Button onClick={() => setCustomizing(false)} className="w-full rounded-none">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
