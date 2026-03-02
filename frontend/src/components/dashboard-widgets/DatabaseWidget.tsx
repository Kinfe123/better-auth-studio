import { useCounts } from "@/contexts/CountsContext";
import { Database, Building2, Users, Zap } from "../PixelIcons";

const compactFmt = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function DatabaseWidget() {
  const { counts, loading } = useCounts();

  const items = [
    { label: "Users", value: counts.users, Icon: Users },
    { label: "Sessions", value: counts.sessions, Icon: Zap },
    { label: "Organizations", value: counts.organizations ?? 0, Icon: Building2 },
    { label: "Teams", value: counts.teams ?? 0, Icon: Building2 },
    { label: "Events", value: counts.events ?? 0, Icon: Database },
  ];

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-2 mb-1 shrink-0">
        <Database className="w-4 h-4 text-white/60" />
        <h4 className="text-xs text-gray-400 uppercase font-mono font-light tracking-wide">
          Database
        </h4>
      </div>
      <hr className="border-white/5 mb-3 -mx-2 shrink-0" />
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">Loading...</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(({ label, value, Icon }) => (
            <li key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                <Icon className="w-3.5 h-3.5" />
                <span className="font-mono uppercase tracking-wider text-[10px]">{label}</span>
              </div>
              <span className="text-white font-mono text-sm">{compactFmt.format(value ?? 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
