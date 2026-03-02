import type { DashboardWidgetItem } from "@/contexts/DashboardWidgetsContext";
import { ResizableWidgetCard } from "./ResizableWidgetCard";
import { WidgetContent } from "./WidgetContent";

interface DashboardWidgetGridProps {
  widgets: DashboardWidgetItem[];
}

export function DashboardWidgetGrid({ widgets }: DashboardWidgetGridProps) {
  if (widgets.length === 0) return null;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
    >
      {widgets.map((item) => (
        <ResizableWidgetCard key={item.id} item={item}>
          <WidgetContent item={item} />
        </ResizableWidgetCard>
      ))}
    </div>
  );
}
