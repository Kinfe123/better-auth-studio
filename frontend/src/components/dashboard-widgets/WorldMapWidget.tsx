import { useEffect, useState } from "react";
import { format } from "date-fns";
import { X } from "../PixelIcons";

interface CountryCount {
  countryCode: string;
  country: string;
  uniqueUsers: number;
}

interface CountryDetail {
  users: Array<{ id: string; name: string | null; email: string | null; createdAt: string | null }>;
  sessions: Array<{
    id: string;
    userId: string;
    ipAddress: string;
    userAgent: string | null;
    createdAt: string | null;
    city: string;
    region: string;
    country: string;
    countryCode: string;
  }>;
  totalSessions: number;
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const codePoints = [...code.toUpperCase()].map(
    (c) => 0x1f1e6 + c.charCodeAt(0) - 65,
  );
  return String.fromCodePoint(...codePoints);
}

function generateMapDots(distribution: CountryCount[], maxCount: number): string {
  const coords: Record<string, [number, number]> = {
    US: [25, 40], CA: [20, 30], BR: [35, 70], GB: [48, 30], FR: [50, 35],
    DE: [52, 33], JP: [80, 38], CN: [72, 38], IN: [68, 48], AU: [82, 72],
    KR: [78, 38], RU: [65, 25], ZA: [55, 75], NG: [50, 55], EG: [55, 42],
    MX: [22, 50], AR: [32, 80], SE: [52, 22], NL: [50, 30], IT: [52, 38],
    ES: [47, 38], PT: [45, 38], PL: [54, 32], TR: [58, 38], SA: [60, 45],
    AE: [62, 45], SG: [72, 55], ID: [75, 58], TH: [72, 50], VN: [73, 48],
    PH: [78, 50], MY: [72, 55], PK: [66, 42], BD: [70, 45], ET: [58, 52],
    KE: [58, 58], TZ: [58, 62], CO: [28, 55], CL: [30, 78], PE: [27, 62],
  };
  return distribution
    .slice(0, 20)
    .map((d) => {
      const [x, y] = coords[d.countryCode] || [50, 50];
      const r = Math.max(2, Math.min(8, (d.uniqueUsers / maxCount) * 8));
      const opacity = 0.15 + (d.uniqueUsers / maxCount) * 0.35;
      return `<circle cx="${x}%" cy="${y}%" r="${r}" fill="white" opacity="${opacity.toFixed(2)}" />`;
    })
    .join("");
}

export function WorldMapWidget() {
  const [distribution, setDistribution] = useState<CountryCount[]>([]);
  const [totalUnique, setTotalUnique] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<CountryCount | null>(null);
  const [detail, setDetail] = useState<CountryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/geo-distribution")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setDistribution(data.distribution || []);
          setTotalUnique(data.totalUnique ?? 0);
        }
      })
      .catch(() => { if (!cancelled) setDistribution([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function openCountryDetail(d: CountryCount) {
    setSelectedCountry(d);
    setDetail(null);
    setDetailLoading(true);
    fetch(`/api/dashboard/geo-country-details?code=${encodeURIComponent(d.countryCode)}`)
      .then((r) => r.json())
      .then((data) => setDetail(data))
      .catch(() => setDetail({ users: [], sessions: [], totalSessions: 0 }))
      .finally(() => setDetailLoading(false));
  }

  const maxCount = Math.max(...distribution.map((d) => d.uniqueUsers), 1);
  const mapSvg = distribution.length > 0
    ? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${generateMapDots(distribution, maxCount)}</svg>`)}`
    : null;

  return (
    <>
      <div className="flex flex-col min-h-0 h-full relative">
        {mapSvg && (
          <div
            className="absolute inset-0 opacity-40 bg-no-repeat bg-center bg-contain pointer-events-none"
            style={{
              backgroundImage: `url("${mapSvg}")`,
              filter: "blur(6px)",
            }}
          />
        )}
        <div className="relative z-[1] flex flex-col min-h-0 h-full">
          <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
            <h4 className="text-xs text-gray-400 uppercase font-mono font-light tracking-wide">
              Users by Location
            </h4>
            {totalUnique > 0 && (
              <span className="text-[10px] font-mono text-gray-600">
                {totalUnique} unique
              </span>
            )}
          </div>
          <hr className="border-white/5 mb-2 -mx-2 shrink-0" />
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs font-mono text-gray-600">Loading...</p>
            </div>
          ) : distribution.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs font-mono text-gray-600">No session IP data yet</p>
            </div>
          ) : (
            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 space-y-0.5">
              {distribution.slice(0, 20).map((d) => (
                <button
                  key={d.countryCode}
                  type="button"
                  onClick={() => openCountryDetail(d)}
                  className="flex items-center gap-2 py-2 px-1 w-full text-left hover:bg-white/5 transition-colors group rounded-none"
                >
                  <span className="text-sm leading-none shrink-0" title={d.country}>
                    {countryFlag(d.countryCode)}
                  </span>
                  <span className="text-[11px] text-gray-400 group-hover:text-gray-200 transition-colors truncate flex-1 min-w-0">
                    {d.country || d.countryCode}
                  </span>
                  <div className="w-12 h-1 bg-white/5 overflow-hidden shrink-0">
                    <div
                      className="h-full bg-white/25 transition-all duration-300"
                      style={{ width: `${(d.uniqueUsers / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 w-4 text-right shrink-0">
                    {d.uniqueUsers}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Country Detail Modal */}
      {selectedCountry && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCountry(null)}
        >
          <div
            className="bg-black border border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-none shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{countryFlag(selectedCountry.countryCode)}</span>
                <div>
                  <h3 className="text-sm text-white font-light">
                    {selectedCountry.country}
                  </h3>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                    {selectedCountry.countryCode} · {selectedCountry.uniqueUsers} unique users
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCountry(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-xs font-mono text-gray-600">Loading details...</p>
                </div>
              ) : detail ? (
                <div className="divide-y divide-white/5">
                  {/* Users Section */}
                  <div className="px-5 py-3">
                    <h4 className="text-[10px] font-mono uppercase text-gray-500 tracking-wider mb-2">
                      Users ({detail.users.length})
                    </h4>
                    {detail.users.length === 0 ? (
                      <p className="text-xs font-mono text-gray-600 py-2">No users found</p>
                    ) : (
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-1.5 px-1 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">Name</th>
                            <th className="text-left py-1.5 px-1 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">Email</th>
                            <th className="text-right py-1.5 px-1 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.users.map((u) => (
                            <tr key={u.id} className="border-b border-white/5 hover:bg-white/[3%] transition-colors">
                              <td className="py-1.5 px-1 text-gray-300">{u.name || "—"}</td>
                              <td className="py-1.5 px-1 text-gray-500 font-mono truncate max-w-[180px]">{u.email || "—"}</td>
                              <td className="py-1.5 px-1 text-gray-600 font-mono text-right whitespace-nowrap">
                                {u.createdAt ? format(new Date(u.createdAt), "MMM dd, yyyy") : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Sessions Section */}
                  <div className="px-5 py-3">
                    <h4 className="text-[10px] font-mono uppercase text-gray-500 tracking-wider mb-2">
                      Recent Sessions ({detail.totalSessions} total)
                    </h4>
                    {detail.sessions.length === 0 ? (
                      <p className="text-xs font-mono text-gray-600 py-2">No sessions found</p>
                    ) : (
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-1.5 px-1 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">IP</th>
                            <th className="text-left py-1.5 px-1 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">City</th>
                            <th className="text-left py-1.5 px-1 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">User Agent</th>
                            <th className="text-right py-1.5 px-1 font-mono font-normal text-gray-500 uppercase text-[9px] tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.sessions.map((s) => (
                            <tr key={s.id} className="border-b border-white/5 hover:bg-white/[3%] transition-colors">
                              <td className="py-1.5 px-1 text-gray-400 font-mono">{s.ipAddress}</td>
                              <td className="py-1.5 px-1 text-gray-500">
                                {s.city !== "Unknown" ? s.city : "—"}
                                {s.region && s.region !== "Unknown" ? `, ${s.region}` : ""}
                              </td>
                              <td className="py-1.5 px-1 text-gray-600 font-mono truncate max-w-[200px]" title={s.userAgent || ""}>
                                {s.userAgent ? shortenUA(s.userAgent) : "—"}
                              </td>
                              <td className="py-1.5 px-1 text-gray-600 font-mono text-right whitespace-nowrap">
                                {s.createdAt ? format(new Date(s.createdAt), "MMM dd, HH:mm") : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function shortenUA(ua: string): string {
  if (ua.length <= 40) return ua;
  const match = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|Brave)\/[\d.]+/);
  if (match) return match[0];
  return `${ua.slice(0, 35)}...`;
}
