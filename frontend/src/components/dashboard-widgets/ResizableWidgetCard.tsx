import { type ReactNode } from "react";
import { X } from "../PixelIcons";
import { Button } from "@/components/ui/button";
import {
  useDashboardWidgets,
  type DashboardWidgetItem,
  type WidgetWidth,
} from "@/contexts/DashboardWidgetsContext";

interface ResizableWidgetCardProps {
  item: DashboardWidgetItem;
  children: ReactNode;
}

const WIDTH_OPTIONS: { value: WidgetWidth; label: string }[] = [
  { value: 1, label: "1 col" },
  { value: 2, label: "2 cols" },
  { value: 3, label: "3 cols" },
];

export function ResizableWidgetCard({ item, children }: ResizableWidgetCardProps) {
  const { updateWidgetWidth, removeWidget, isCustomizing } = useDashboardWidgets();

  return (
    <div
      className="bg-gradient-to-b from-white/[4%] to-white/[2.5%] border border-white/10 rounded-none p-3 md:p-6 relative group"
      style={{ gridColumn: `span ${item.width}` }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/20" />
      <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/20" />
      <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/20" />
      <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/20" />
      <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/20" />
      <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/20" />
      <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/20" />
      <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/20" />

      {isCustomizing && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <select
            value={item.width}
            onChange={(e) => updateWidgetWidth(item.id, Number(e.target.value) as WidgetWidth)}
            className="bg-black border border-white/20 text-white text-xs px-2 py-1 rounded-none focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            {WIDTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeWidget(item.id)}
            className="h-7 w-7 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-none"
            title="Remove widget"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div className={isCustomizing ? "pt-8" : ""}>{children}</div>
    </div>
  );
}
