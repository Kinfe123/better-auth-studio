import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "better-auth-studio-dashboard-widgets";
const SLOT_OVERRIDES_KEY = "better-auth-studio-dashboard-slot-overrides";
const PANEL_EXPANDED_KEY = "better-auth-studio-dashboard-panel-expanded";

export const OVERVIEW_SLOT_IDS = [
  "total-users",
  "activity",
  "active-users",
  "new-users",
  "organizations",
  "teams",
  "security-insights",
] as const;
export type OverviewSlotId = (typeof OVERVIEW_SLOT_IDS)[number];

export type WidgetWidth = 1 | 2 | 3;

export const DRAGGABLE_WIDGET_TYPES = [
  "events",
  "database",
  "invitations",
  "recent-users",
  "recent-organizations",
  "recent-teams",
  "world-map",
] as const;

export type WidgetType = OverviewSlotId | (typeof DRAGGABLE_WIDGET_TYPES)[number];

export interface WidgetConfig {
  recentUsersHours?: number;
  recentUsersFrom?: string;
  recentUsersTo?: string;
}

export interface DashboardWidgetItem {
  id: string;
  widgetType: WidgetType;
  width: WidgetWidth;
  config?: WidgetConfig;
}

const DEFAULT_WIDGETS: DashboardWidgetItem[] = [
  { id: "w-recent-users", widgetType: "recent-users", width: 1, config: { recentUsersHours: 24 } },
  { id: "w-recent-organizations", widgetType: "recent-organizations", width: 1 },
  { id: "w-recent-teams", widgetType: "recent-teams", width: 1 },
  { id: "w-events", widgetType: "events", width: 1 },
  { id: "w-invitations", widgetType: "invitations", width: 1 },
  { id: "w-database", widgetType: "database", width: 1 },
  { id: "w-world-map", widgetType: "world-map", width: 1 },
];

export const WIDGET_LABELS: Record<string, string> = {
  "total-users": "Total Users",
  activity: "Activity",
  "active-users": "Active Users",
  "new-users": "New Users",
  organizations: "Organizations",
  teams: "Teams",
  "security-insights": "Security Insights",
  events: "Events",
  database: "Database",
  invitations: "Invitations",
  "recent-users": "Recent Users",
  "world-map": "World Map",
  "recent-organizations": "Recent Orgs",
  "recent-teams": "Recent Teams",
};

interface DashboardWidgetsContextType {
  widgets: DashboardWidgetItem[];
  setWidgets: (
    widgets: DashboardWidgetItem[] | ((prev: DashboardWidgetItem[]) => DashboardWidgetItem[]),
  ) => void;
  updateWidgetWidth: (id: string, width: WidgetWidth) => void;
  updateWidgetConfig: (id: string, config: Partial<WidgetConfig>) => void;
  removeWidget: (id: string) => void;
  addWidget: (widgetType: WidgetType, width?: WidgetWidth, config?: WidgetConfig) => boolean;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
  availableToAdd: WidgetType[];
  resetToDefault: () => void;
  isCustomizing: boolean;
  setCustomizing: (v: boolean) => void;
  slotOverrides: Partial<Record<OverviewSlotId, WidgetType>>;
  setSlotOverride: (slotId: OverviewSlotId, widgetType: WidgetType | null) => void;
  panelExpanded: boolean;
  setPanelExpanded: (v: boolean) => void;
}

const DashboardWidgetsContext = createContext<DashboardWidgetsContextType | undefined>(undefined);

function loadStored(): DashboardWidgetItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DashboardWidgetItem[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (_e) {}
  return null;
}

function saveStored(widgets: DashboardWidgetItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch (_e) {}
}

function loadSlotOverrides(): Partial<Record<OverviewSlotId, WidgetType>> {
  try {
    const raw = localStorage.getItem(SLOT_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Partial<Record<OverviewSlotId, WidgetType>> = {};
    for (const id of OVERVIEW_SLOT_IDS) {
      if (parsed[id] && typeof parsed[id] === "string") out[id] = parsed[id] as WidgetType;
    }
    return out;
  } catch (_e) {
    return {};
  }
}

function saveSlotOverrides(overrides: Partial<Record<OverviewSlotId, WidgetType>>) {
  try {
    localStorage.setItem(SLOT_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (_e) {}
}

function loadPanelExpanded(): boolean {
  try {
    const raw = localStorage.getItem(PANEL_EXPANDED_KEY);
    if (raw === null) return false;
    return raw === "true";
  } catch (_e) {
    return false;
  }
}

export function DashboardWidgetsProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgetsState] = useState<DashboardWidgetItem[]>(
    () => loadStored() ?? DEFAULT_WIDGETS,
  );
  const [isCustomizing, setCustomizing] = useState(false);
  const [slotOverrides, setSlotOverridesState] = useState<
    Partial<Record<OverviewSlotId, WidgetType>>
  >(() => loadSlotOverrides());
  const [panelExpanded, setPanelExpandedState] = useState(() => loadPanelExpanded());

  useEffect(() => {
    saveStored(widgets);
  }, [widgets]);
  useEffect(() => {
    saveSlotOverrides(slotOverrides);
  }, [slotOverrides]);
  useEffect(() => {
    try {
      localStorage.setItem(PANEL_EXPANDED_KEY, String(panelExpanded));
    } catch (_e) {}
  }, [panelExpanded]);

  const setPanelExpanded = useCallback((v: boolean) => {
    setPanelExpandedState(v);
  }, []);

  const setSlotOverride = useCallback((slotId: OverviewSlotId, widgetType: WidgetType | null) => {
    setSlotOverridesState((prev) => {
      const next = { ...prev };
      if (widgetType == null) delete next[slotId];
      else next[slotId] = widgetType;
      return next;
    });
  }, []);

  const updateWidgetWidth = useCallback((id: string, width: WidgetWidth) => {
    setWidgetsState((prev) => prev.map((w) => (w.id === id ? { ...w, width } : w)));
  }, []);

  const updateWidgetConfig = useCallback((id: string, config: Partial<WidgetConfig>) => {
    setWidgetsState((prev) =>
      prev.map((w) => (w.id === id ? { ...w, config: { ...w.config, ...config } } : w)),
    );
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgetsState((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    setWidgetsState((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length)
        return prev;
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const usedTypes = useMemo(() => new Set(widgets.map((w) => w.widgetType)), [widgets]);
  const availableToAdd = useMemo(() => {
    const types: WidgetType[] = [];
    for (const t of DRAGGABLE_WIDGET_TYPES) {
      if (!usedTypes.has(t)) types.push(t);
    }
    return types;
  }, [usedTypes]);

  const addWidget = useCallback(
    (widgetType: WidgetType, width: WidgetWidth = 1, config?: WidgetConfig): boolean => {
      if (usedTypes.has(widgetType)) return false;
      const id = `w-${widgetType}-${Date.now()}`;
      setWidgetsState((prev) => [...prev, { id, widgetType, width, config }]);
      return true;
    },
    [usedTypes],
  );

  const resetToDefault = useCallback(() => {
    setWidgetsState(DEFAULT_WIDGETS);
  }, []);

  const value: DashboardWidgetsContextType = useMemo(
    () => ({
      widgets,
      setWidgets: (
        arg: DashboardWidgetItem[] | ((prev: DashboardWidgetItem[]) => DashboardWidgetItem[]),
      ) => {
        setWidgetsState(typeof arg === "function" ? arg : () => arg);
      },
      updateWidgetWidth,
      updateWidgetConfig,
      removeWidget,
      addWidget,
      reorderWidgets,
      availableToAdd,
      resetToDefault,
      isCustomizing,
      setCustomizing,
      slotOverrides,
      setSlotOverride,
      panelExpanded,
      setPanelExpanded,
    }),
    [
      widgets,
      updateWidgetWidth,
      updateWidgetConfig,
      removeWidget,
      addWidget,
      reorderWidgets,
      availableToAdd,
      resetToDefault,
      isCustomizing,
      slotOverrides,
      setSlotOverride,
      panelExpanded,
      setPanelExpanded,
    ],
  );

  return (
    <DashboardWidgetsContext.Provider value={value}>{children}</DashboardWidgetsContext.Provider>
  );
}

export function useDashboardWidgets() {
  const ctx = useContext(DashboardWidgetsContext);
  if (ctx === undefined)
    throw new Error("useDashboardWidgets must be used within DashboardWidgetsProvider");
  return ctx;
}
