import { useEffect, useState } from "react";
import { format } from "date-fns";
import { BarChart3 } from "../PixelIcons";

interface EventItem {
  id: string;
  type: string;
  timestamp: string;
  status?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

function formatEventTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return format(new Date(ts), "MMM dd");
}

export function EventsWidget() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [listRes, countRes] = await Promise.all([
          fetch("/api/events?limit=15&sort=desc"),
          fetch("/api/events/count"),
        ]);
        if (cancelled) return;
        if (listRes.ok) {
          const data = await listRes.json();
          setEvents(data.events || []);
        }
        if (countRes.ok) {
          const countData = await countRes.json();
          setTotal(countData.total ?? countData.count ?? null);
        }
      } catch (_e) {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-white/60" />
          <h4 className="text-xs text-gray-400 uppercase font-mono font-light tracking-wide">
            Events
          </h4>
        </div>
        {total != null && (
          <span className="text-[10px] font-mono text-gray-600">
            {total.toLocaleString()} total
          </span>
        )}
      </div>
      <hr className="border-white/5 mb-2 -mx-2 shrink-0" />
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">Loading...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">No events yet</p>
        </div>
      ) : (
        <div className="overflow-auto custom-scrollbar flex-1 min-h-0">
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 bg-black/90 backdrop-blur-sm z-10">
              <tr className="border-b border-white/10">
                <th className="text-left py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Type
                </th>
                <th className="text-left py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Status
                </th>
                <th className="text-right py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 8).map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-white/5 hover:bg-white/[3%] transition-colors group"
                >
                  <td className="py-1.5 px-1.5 text-gray-300 group-hover:text-white truncate max-w-[120px] transition-colors font-mono">
                    {e.type}
                  </td>
                  <td className="py-1.5 px-1.5">
                    {e.status ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border rounded-sm uppercase font-mono ${
                          e.status === "success"
                            ? "text-green-400/80 border-green-400/20"
                            : e.status === "error"
                              ? "text-red-400/80 border-red-400/20"
                              : "text-gray-500 border-white/10"
                        }`}
                      >
                        {e.status}
                      </span>
                    ) : (
                      <span className="text-gray-600 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-1.5 px-1.5 text-gray-600 whitespace-nowrap text-right font-mono">
                    {e.timestamp ? formatEventTime(e.timestamp) : "—"}
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
