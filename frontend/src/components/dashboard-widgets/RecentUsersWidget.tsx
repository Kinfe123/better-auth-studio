import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ChevronDown, Users } from "../PixelIcons";

interface RecentUser {
  id: string;
  name?: string | null;
  email?: string | null;
  createdAt?: string;
  country?: string;
  countryCode?: string;
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const codePoints = [...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

const PRESET_OPTIONS = [
  { label: "30 min", hours: 0.5 },
  { label: "1 hour", hours: 1 },
  { label: "6 hours", hours: 6 },
  { label: "12 hours", hours: 12 },
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "1 week", hours: 168 },
] as const;

interface RecentUsersWidgetProps {
  hours?: number;
  onHoursChange?: (hours: number) => void;
  customFrom?: string;
  customTo?: string;
  onCustomRangeChange?: (from: string | undefined, to: string | undefined) => void;
  compact?: boolean;
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return format(new Date(dateStr), "MMM dd");
}

export function RecentUsersWidget({
  hours: initialHours = 24,
  onHoursChange,
  customFrom,
  customTo,
  onCustomRangeChange,
  compact,
}: RecentUsersWidgetProps) {
  const [users, setUsers] = useState<RecentUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedHours, setSelectedHours] = useState(initialHours);
  const [isCustomRange, setIsCustomRange] = useState(!!(customFrom || customTo));
  const [localFrom, setLocalFrom] = useState(customFrom ?? "");
  const [localTo, setLocalTo] = useState(customTo ?? "");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const effectiveHours = useMemo(() => {
    if (isCustomRange && localFrom) {
      const fromDate = new Date(localFrom);
      const toDate = localTo ? new Date(localTo) : new Date();
      return Math.max(1, (toDate.getTime() - fromDate.getTime()) / 3600000);
    }
    return Math.min(8760, Math.max(1, selectedHours));
  }, [selectedHours, isCustomRange, localFrom, localTo]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const h = Math.max(1, Math.ceil(effectiveHours));
    fetch(`/api/dashboard/recent-users?hours=${h}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        let fetched: RecentUser[] = data.users || [];
        if (isCustomRange && localFrom) {
          const fromTs = new Date(localFrom).getTime();
          const toTs = localTo ? new Date(localTo).getTime() : Date.now();
          fetched = fetched.filter((u) => {
            if (!u.createdAt) return false;
            const t = new Date(u.createdAt).getTime();
            return t >= fromTs && t <= toTs;
          });
        }
        setUsers(fetched);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveHours, isCustomRange, localFrom, localTo]);

  const activeLabel = useMemo(() => {
    if (isCustomRange && localFrom) {
      const from = format(new Date(localFrom), "MMM dd");
      const to = localTo ? format(new Date(localTo), "MMM dd") : "now";
      return `${from} — ${to}`;
    }
    const preset = PRESET_OPTIONS.find((p) => p.hours === selectedHours);
    return preset ? `Last ${preset.label}` : `Last ${selectedHours}h`;
  }, [selectedHours, isCustomRange, localFrom, localTo]);

  function selectPreset(h: number) {
    setSelectedHours(h);
    setIsCustomRange(false);
    setLocalFrom("");
    setLocalTo("");
    onHoursChange?.(h);
    onCustomRangeChange?.(undefined, undefined);
    setShowDropdown(false);
  }

  function applyCustomRange() {
    if (!localFrom) return;
    setIsCustomRange(true);
    onCustomRangeChange?.(localFrom, localTo || undefined);
    setShowDropdown(false);
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-white/60" />
          <h4 className="text-xs text-gray-400 uppercase font-mono font-light tracking-wide">
            Recent Users
          </h4>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-mono text-gray-500 hover:text-white transition-colors uppercase"
          >
            <span className="truncate max-w-[120px]">{activeLabel}</span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </button>
          {showDropdown && (
            <div className="absolute top-full mt-1 right-0 z-50 w-[220px] bg-black border border-white/10 shadow-2xl">
              {PRESET_OPTIONS.map((p) => (
                <button
                  key={p.hours}
                  type="button"
                  onClick={() => selectPreset(p.hours)}
                  className={`block w-full text-left px-3 py-1.5 text-[11px] font-mono border-b border-white/5 transition-colors ${
                    !isCustomRange && selectedHours === p.hours
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Last {p.label}
                </button>
              ))}
              <div className="px-3 py-2 border-t border-white/10">
                <p className="text-[9px] font-mono uppercase text-gray-500 mb-1.5 tracking-wider">
                  Custom range
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                    From
                    <input
                      type="datetime-local"
                      value={localFrom}
                      onChange={(e) => setLocalFrom(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 text-white text-[10px] font-mono px-1.5 py-1 rounded-none focus:outline-none focus:border-white/30 min-w-0"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                    To&nbsp;&nbsp;
                    <input
                      type="datetime-local"
                      value={localTo}
                      onChange={(e) => setLocalTo(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 text-white text-[10px] font-mono px-1.5 py-1 rounded-none focus:outline-none focus:border-white/30 min-w-0"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={applyCustomRange}
                    disabled={!localFrom}
                    className="mt-1 text-[10px] font-mono uppercase text-center py-1 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] font-mono text-gray-600 mb-2 shrink-0">
        {activeLabel} · {total} total
      </p>

      <hr className="border-white/5 mb-2 -mx-2 shrink-0" />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">Loading...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">No users in this period</p>
        </div>
      ) : (
        <div className="overflow-auto custom-scrollbar flex-1 min-h-0">
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 bg-black/90 backdrop-blur-sm z-10">
              <tr className="border-b border-white/10">
                <th className="text-left py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Name
                </th>
                <th className="text-left py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Email
                </th>
                {!compact && (
                  <th className="text-left py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                    Country
                  </th>
                )}
                <th className="text-right py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, compact ? 8 : 20).map((u) => (
                <tr
                  key={u.id}
                  onClick={() => navigate(`/users/${u.id}`)}
                  className="border-b border-white/5 hover:bg-white/[3%] cursor-pointer transition-colors group"
                >
                  <td
                    className="py-1.5 px-1.5 text-gray-300 group-hover:text-white truncate max-w-[90px] transition-colors"
                    title={u.name || ""}
                  >
                    {u.name || "—"}
                  </td>
                  <td
                    className="py-1.5 px-1.5 text-gray-500 truncate max-w-[110px] font-mono"
                    title={u.email || ""}
                  >
                    {u.email || "—"}
                  </td>
                  {!compact && (
                    <td className="py-1.5 px-1.5 text-gray-600 font-mono">
                      <span className="inline-flex items-center gap-1">
                        {u.countryCode && (
                          <span className="text-xs leading-none">{countryFlag(u.countryCode)}</span>
                        )}
                        {u.country ?? "—"}
                      </span>
                    </td>
                  )}
                  <td className="py-1.5 px-1.5 text-gray-600 whitespace-nowrap text-right font-mono">
                    {u.createdAt ? formatRelativeTime(u.createdAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
