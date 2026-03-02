import type { DashboardWidgetItem } from "@/contexts/DashboardWidgetsContext";
import { useDashboardWidgets } from "@/contexts/DashboardWidgetsContext";
import { DatabaseWidget } from "./DatabaseWidget";
import { EventsWidget } from "./EventsWidget";
import { InvitationsWidget } from "./InvitationsWidget";
import { RecentUsersWidget } from "./RecentUsersWidget";
import { RecentOrganizationsWidget } from "./RecentOrganizationsWidget";
import { RecentTeamsWidget } from "./RecentTeamsWidget";
import { WorldMapWidget } from "./WorldMapWidget";

export interface WidgetContentProps {
  item: DashboardWidgetItem;
  compact?: boolean;
}

export function WidgetContent({ item, compact }: WidgetContentProps) {
  const { updateWidgetConfig } = useDashboardWidgets();

  switch (item.widgetType) {
    case "events":
      return <EventsWidget />;
    case "database":
      return <DatabaseWidget />;
    case "invitations":
      return <InvitationsWidget />;
    case "recent-users":
      return (
        <RecentUsersWidget
          hours={item.config?.recentUsersHours ?? 24}
          onHoursChange={(hours) => updateWidgetConfig(item.id, { recentUsersHours: hours })}
          customFrom={item.config?.recentUsersFrom}
          customTo={item.config?.recentUsersTo}
          onCustomRangeChange={(from, to) =>
            updateWidgetConfig(item.id, { recentUsersFrom: from, recentUsersTo: to })
          }
          compact={compact}
        />
      );
    case "recent-organizations":
      return <RecentOrganizationsWidget />;
    case "recent-teams":
      return <RecentTeamsWidget />;
    case "world-map":
      return <WorldMapWidget />;
    default:
      return (
        <div className="text-xs font-mono text-gray-600 p-4">
          Widget &quot;{item.widgetType}&quot; is not available.
        </div>
      );
  }
}
