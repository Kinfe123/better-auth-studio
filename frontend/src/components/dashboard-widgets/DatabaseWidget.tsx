import { useDatabaseSchemaSummary } from "@/hooks/useDatabaseSchemaSummary";
import { Analytics, Database, Building2, Settings, Users } from "../PixelIcons";

const compactFmt = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function DatabaseWidget() {
  const { summary, loading } = useDatabaseSchemaSummary();

  const items = [
    { label: "Tables", value: summary.tableCount, Icon: Database },
    { label: "Core", value: summary.coreTableCount, Icon: Users },
    { label: "Extended", value: summary.pluginTableCount, Icon: Building2 },
    { label: "Fields", value: summary.fieldCount, Icon: Settings },
    { label: "Relations", value: summary.relationshipCount, Icon: Analytics },
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
