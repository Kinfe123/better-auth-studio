import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Building2 } from "../PixelIcons";

interface Org {
  id: string;
  name?: string;
  slug?: string;
  createdAt?: string;
  memberCount?: number;
}

export function RecentOrganizationsWidget() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/recent-organizations")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setOrgs(data.organizations || []);
      })
      .catch(() => {
        if (!cancelled) setOrgs([]);
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
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-white/60" />
          <h4 className="text-xs text-gray-400 uppercase font-mono font-light tracking-wide">
            Recent Orgs
          </h4>
        </div>
        <span className="text-[10px] font-mono text-gray-600">{orgs.length} total</span>
      </div>
      <hr className="border-white/5 mb-2 -mx-2 shrink-0" />
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">Loading...</p>
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">No organizations</p>
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
                  Members
                </th>
                <th className="text-right py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {orgs.slice(0, 10).map((o) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/organizations/${o.id}`)}
                  className="border-b border-white/5 hover:bg-white/[3%] cursor-pointer transition-colors group"
                >
                  <td
                    className="py-1.5 px-1.5 text-gray-300 group-hover:text-white truncate max-w-[140px] transition-colors"
                    title={o.name || ""}
                  >
                    {o.name || o.slug || "—"}
                  </td>
                  <td className="py-1.5 px-1.5 text-gray-600 font-mono">{o.memberCount ?? "—"}</td>
                  <td className="py-1.5 px-1.5 text-gray-600 whitespace-nowrap text-right font-mono">
                    {o.createdAt ? format(new Date(o.createdAt), "MMM dd, HH:mm") : "—"}
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
