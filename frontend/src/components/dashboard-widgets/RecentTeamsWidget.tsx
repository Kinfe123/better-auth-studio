import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Team {
  id: string;
  name?: string;
  slug?: string;
  organizationId?: string;
  createdAt?: string;
}

export function RecentTeamsWidget() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/recent-teams")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTeams(data.teams || []);
      })
      .catch(() => {
        if (!cancelled) setTeams([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
        <h4 className="text-xs text-gray-400 uppercase font-mono font-light tracking-wide">
          Recent Teams
        </h4>
        <span className="text-[10px] font-mono text-gray-600">{teams.length} total</span>
      </div>
      <hr className="border-white/5 mb-2 -mx-2 shrink-0" />
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">Loading...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">No teams</p>
        </div>
      ) : (
        <div className="overflow-auto custom-scrollbar flex-1 min-h-0">
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 bg-black/90 backdrop-blur-sm z-10">
              <tr className="border-b border-white/10">
                <th className="text-left py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Name
                </th>
                <th className="text-right py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.slice(0, 10).map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/teams/${t.id}`)}
                  className="border-b border-white/5 hover:bg-white/[3%] cursor-pointer transition-colors group"
                >
                  <td
                    className="py-1.5 px-1.5 text-gray-300 group-hover:text-white truncate max-w-[160px] transition-colors"
                    title={t.name || ""}
                  >
                    {t.name || t.slug || "—"}
                  </td>
                  <td className="py-1.5 px-1.5 text-gray-600 whitespace-nowrap text-right font-mono">
                    {t.createdAt ? format(new Date(t.createdAt), "MMM dd, HH:mm") : "—"}
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
