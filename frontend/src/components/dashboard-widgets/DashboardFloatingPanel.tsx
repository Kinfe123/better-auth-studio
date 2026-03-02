import type React from "react";
import { useCallback, useState } from "react";
import { GripVertical, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { useDashboardWidgets } from "@/contexts/DashboardWidgetsContext";
import { WIDGET_LABELS } from "@/contexts/DashboardWidgetsContext";
import { WIDGET_TYPE_DRAG_KEY } from "./DropTargetSlot";

export const PANEL_WIDTH = 300;

/* ------------------------------------------------------------------ */
/*  Static mini-preview for each widget type                          */
/* ------------------------------------------------------------------ */

function PreviewRow({ cells, accent }: { cells: string[]; accent?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 py-[3px] ${accent ? "text-gray-300" : "text-gray-500"}`}
    >
      {cells.map((c, i) => (
        <span
          key={i}
          className={`truncate font-mono text-[7px] leading-tight ${i === 0 ? "flex-1 min-w-0" : "shrink-0"}`}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function StatusDot({ color }: { color: string }) {
  return <span className={`inline-block w-1 h-1 rounded-full ${color} shrink-0`} />;
}

function PreviewEvents() {
  const rows = [
    { type: "user.login", status: "success", time: "2m" },
    { type: "session.created", status: "success", time: "5m" },
    { type: "password.reset", status: "error", time: "18m" },
    { type: "user.updated", status: "success", time: "1h" },
  ];
  return (
    <div className="space-y-0">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider flex-1">
          Type
        </span>
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider w-8 text-center">
          Status
        </span>
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider w-5 text-right">
          Time
        </span>
      </div>
      <div className="border-t border-white/5" />
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5 py-[2.5px]">
          <span className="text-[7px] font-mono text-gray-400 truncate flex-1">{r.type}</span>
          <span className="w-8 flex justify-center">
            <StatusDot color={r.status === "success" ? "bg-green-400/70" : "bg-red-400/70"} />
          </span>
          <span className="text-[7px] font-mono text-gray-600 w-5 text-right">{r.time}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewDatabase() {
  const items = [
    { label: "Users", value: "1,247" },
    { label: "Sessions", value: "8,431" },
    { label: "Organizations", value: "52" },
    { label: "Events", value: "24.1K" },
  ];
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="text-[7px] font-mono text-gray-500 uppercase tracking-wider">
            {it.label}
          </span>
          <span className="text-[8px] font-mono text-gray-300">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewInvitations() {
  const rows = [
    { email: "alice@acme.io", role: "admin", time: "Mar 01" },
    { email: "bob@corp.co", role: "member", time: "Feb 28" },
    { email: "dev@team.io", role: "member", time: "Feb 27" },
  ];
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider flex-1">
          Email
        </span>
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider w-10 text-center">
          Role
        </span>
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider w-10 text-right">
          Date
        </span>
      </div>
      <div className="border-t border-white/5" />
      {rows.map((r, i) => (
        <PreviewRow key={i} cells={[r.email, r.role, r.time]} />
      ))}
    </div>
  );
}

function PreviewRecentUsers() {
  const rows = [
    { name: "Alice Chen", email: "alice@acme.io", country: "🇺🇸", joined: "2m ago" },
    { name: "Yuki Tanaka", email: "yuki@dev.jp", country: "🇯🇵", joined: "1h ago" },
    { name: "Max Weber", email: "max@web.de", country: "🇩🇪", joined: "3h ago" },
  ];
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider flex-1 min-w-0">
          Name
        </span>
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider w-[60px]">
          Email
        </span>
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider w-4 text-center">
          &nbsp;
        </span>
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider w-10 text-right">
          Joined
        </span>
      </div>
      <div className="border-t border-white/5" />
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-1 py-[2.5px]">
          <span className="text-[7px] font-mono text-gray-400 truncate flex-1 min-w-0">
            {r.name}
          </span>
          <span className="text-[7px] font-mono text-gray-600 truncate w-[60px]">{r.email}</span>
          <span className="text-[8px] w-4 text-center leading-none">{r.country}</span>
          <span className="text-[7px] font-mono text-gray-600 w-10 text-right">{r.joined}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewRecentOrgs() {
  const rows = [
    { name: "Acme Corp", members: "24", created: "Mar 01" },
    { name: "Globex Inc", members: "12", created: "Feb 28" },
    { name: "Initech", members: "8", created: "Feb 25" },
  ];
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider flex-1">
          Name
        </span>
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider w-10 text-center">
          Members
        </span>
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider w-10 text-right">
          Created
        </span>
      </div>
      <div className="border-t border-white/5" />
      {rows.map((r, i) => (
        <PreviewRow key={i} cells={[r.name, r.members, r.created]} />
      ))}
    </div>
  );
}

function PreviewRecentTeams() {
  const rows = [
    { name: "Engineering", created: "Mar 01" },
    { name: "Design", created: "Feb 28" },
    { name: "Marketing", created: "Feb 22" },
  ];
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider flex-1">
          Name
        </span>
        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-wider w-10 text-right">
          Created
        </span>
      </div>
      <div className="border-t border-white/5" />
      {rows.map((r, i) => (
        <PreviewRow key={i} cells={[r.name, r.created]} />
      ))}
    </div>
  );
}

function PreviewWorldMap() {
  const countries = [
    { flag: "🇺🇸", name: "United States", pct: 85 },
    { flag: "🇬🇧", name: "United Kingdom", pct: 55 },
    { flag: "🇩🇪", name: "Germany", pct: 40 },
    { flag: "🇯🇵", name: "Japan", pct: 25 },
  ];
  return (
    <div className="space-y-[3px]">
      {countries.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-[8px] leading-none shrink-0">{c.flag}</span>
          <span className="text-[7px] font-mono text-gray-400 truncate flex-1 min-w-0">
            {c.name}
          </span>
          <div className="w-10 h-[3px] bg-white/5 overflow-hidden shrink-0">
            <div className="h-full bg-white/25" style={{ width: `${c.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const PREVIEW_COMPONENTS: Record<string, () => React.ReactNode> = {
  events: PreviewEvents,
  database: PreviewDatabase,
  invitations: PreviewInvitations,
  "recent-users": PreviewRecentUsers,
  "recent-organizations": PreviewRecentOrgs,
  "recent-teams": PreviewRecentTeams,
  "world-map": PreviewWorldMap,
};

/* ------------------------------------------------------------------ */
/*  Main panel                                                        */
/* ------------------------------------------------------------------ */

export function DashboardFloatingPanel() {
  const {
    widgets,
    reorderWidgets,
    removeWidget,
    addWidget,
    availableToAdd,
    resetToDefault,
    panelExpanded: expanded,
    setPanelExpanded: setExpanded,
  } = useDashboardWidgets();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number, widgetType: string) => {
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.setData(WIDGET_TYPE_DRAG_KEY, widgetType);
    setDraggedIndex(index);
  }, []);

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

  if (widgets.length === 0 && availableToAdd.length === 0) return null;

  return (
    <div
      className="fixed top-2 right-0 z-30 flex flex-col border-l border-white/10 bg-black/[.97] backdrop-blur-md transition-[width] duration-200 ease-out"
      style={{ width: expanded ? PANEL_WIDTH : 0, height: "100vh" }}
    >
      {/* Toggle tab */}
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
          <div className="shrink-0 px-3 pt-3 pb-2 border-y border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-mono font-medium text-gray-300 uppercase tracking-wider">
                Widgets
              </h3>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 leading-tight">
              Drag a widget onto any dashboard card to replace it
            </p>
          </div>

          {/* Widget preview cards */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 py-2 space-y-2">
            {widgets.map((item, index) => {
              const Preview = PREVIEW_COMPONENTS[item.widgetType];
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, item.widgetType)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative border bg-gradient-to-b from-white/[3%] to-white/[1.5%] transition-all cursor-grab active:cursor-grabbing select-none ${
                    draggedIndex === index
                      ? "opacity-40 border-white/20 scale-95"
                      : "border-white/[6%] hover:border-white/15"
                  } ${dropTargetIndex === index ? "border-white/30 bg-white/5 scale-[1.02]" : ""}`}
                >
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-[8px] h-[0.5px] bg-white/15" />
                  <div className="absolute top-0 left-0 w-[0.5px] h-[8px] bg-white/15" />
                  <div className="absolute top-0 right-0 w-[8px] h-[0.5px] bg-white/15" />
                  <div className="absolute top-0 right-0 w-[0.5px] h-[8px] bg-white/15" />
                  <div className="absolute bottom-0 left-0 w-[8px] h-[0.5px] bg-white/15" />
                  <div className="absolute bottom-0 left-0 w-[0.5px] h-[8px] bg-white/15" />
                  <div className="absolute bottom-0 right-0 w-[8px] h-[0.5px] bg-white/15" />
                  <div className="absolute bottom-0 right-0 w-[0.5px] h-[8px] bg-white/15" />

                  {/* Card header */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-white/5">
                    <GripVertical className="w-3 h-3 text-gray-700 group-hover:text-gray-500 shrink-0 transition-colors" />
                    <span className="text-[10px] font-mono text-gray-400 group-hover:text-gray-300 uppercase tracking-wider truncate flex-1 transition-colors">
                      {WIDGET_LABELS[item.widgetType]}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeWidget(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0 p-0.5"
                      title="Remove widget"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Preview content */}
                  <div className="px-2.5 py-2 pointer-events-none">
                    {Preview ? (
                      <Preview />
                    ) : (
                      <div className="text-[8px] font-mono text-gray-600 py-2 text-center">
                        Preview unavailable
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

          {/* Footer */}
          <div className="shrink-0 px-3 py-2 pb-4 border-t border-white/10">
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
