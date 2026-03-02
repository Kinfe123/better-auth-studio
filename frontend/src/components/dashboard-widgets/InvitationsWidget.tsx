import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Invitation {
  id: string;
  email: string;
  role?: string;
  status?: string;
  createdAt?: string;
}

export function InvitationsWidget() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/invitations")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setInvitations(data.invitations || []);
      })
      .catch(() => {
        if (!cancelled) setInvitations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pending = invitations.filter((i) => (i.status || "pending") === "pending");

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
        <h4 className="text-xs text-gray-400 uppercase font-mono font-light tracking-wide">
          Invitations
        </h4>
        <span className="text-[10px] font-mono text-gray-600">{pending.length} pending</span>
      </div>
      <hr className="border-white/5 mb-2 -mx-2 shrink-0" />
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">Loading...</p>
        </div>
      ) : pending.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-gray-600">No pending invitations</p>
        </div>
      ) : (
        <div className="overflow-auto custom-scrollbar flex-1 min-h-0">
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 bg-black/90 backdrop-blur-sm z-10">
              <tr className="border-b border-white/10">
                <th className="text-left py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Email
                </th>
                <th className="text-left py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Role
                </th>
                <th className="text-right py-1.5 px-1.5 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {pending.slice(0, 10).map((i) => (
                <tr
                  key={i.id}
                  className="border-b border-white/5 hover:bg-white/[3%] transition-colors group"
                >
                  <td
                    className="py-1.5 px-1.5 text-gray-300 group-hover:text-white truncate max-w-[120px] font-mono transition-colors"
                    title={i.email}
                  >
                    {i.email}
                  </td>
                  <td className="py-1.5 px-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 border border-white/10 rounded-sm uppercase font-mono text-gray-500">
                      {i.role || "member"}
                    </span>
                  </td>
                  <td className="py-1.5 px-1.5 text-gray-600 whitespace-nowrap text-right font-mono">
                    {i.createdAt ? format(new Date(i.createdAt), "MMM dd, HH:mm") : "—"}
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
