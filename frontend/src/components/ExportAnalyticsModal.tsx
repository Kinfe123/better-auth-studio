import { format } from "date-fns";
import { toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCounts } from "@/contexts/CountsContext";
import { assetPath } from "@/lib/utils";
import { Calendar as CalendarIcon, X } from "./PixelIcons";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export type ExportMode = "overview" | "users" | "activity" | "organizations" | "teams";

const INDIVIDUAL_MODES: Exclude<ExportMode, "overview">[] = [
  "users",
  "activity",
  "organizations",
  "teams",
];

interface ExportAnalyticsModalProps {
  open?: boolean;
  defaultMode?: ExportMode;
  onClose: () => void;
  initialMode?: ExportMode;
}

interface AnalyticsData {
  data: number[];
  labels: string[];
  percentageChange: number;
  total: number;
  previousTotal?: number;
}

const MODE_ANALYTICS: Record<
  Exclude<ExportMode, "overview">,
  { subtitle: string; analyticsTypes: { type: string; label: string }[] }
> = {
  users: {
    subtitle: "User growth and engagement",
    analyticsTypes: [
      { type: "users", label: "Total Users" },
      { type: "newUsers", label: "New Users" },
      { type: "activeUsers", label: "Active Users" },
    ],
  },
  activity: {
    subtitle: "Activity and engagement metrics",
    analyticsTypes: [{ type: "sessions", label: "Sessions" }],
  },
  organizations: {
    subtitle: "Organization growth",
    analyticsTypes: [{ type: "organizations", label: "Organizations" }],
  },
  teams: {
    subtitle: "Team analytics",
    analyticsTypes: [{ type: "teams", label: "Teams" }],
  },
};

type CountKey = "users" | "organizations" | "sessions" | "teams";

const FOOTER_STAT_MAP: Record<string, { key: CountKey; label: string }[]> = {
  users: [{ key: "users", label: "Total Users" }],
  activity: [{ key: "sessions", label: "Sessions" }],
  organizations: [{ key: "organizations", label: "Organizations" }],
  teams: [{ key: "teams", label: "Teams" }],
};

const PERIODS = [
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "3M", label: "3M" },
  { id: "6M", label: "6M" },
  { id: "1Y", label: "1Y" },
  { id: "ALL", label: "ALL" },
];

function formatAxisValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(Math.round(value));
}

function pickAxisLabels(labels: string[], maxLabels: number): { label: string; index: number }[] {
  if (labels.length <= maxLabels) {
    return labels.map((l, i) => ({ label: l, index: i }));
  }
  const result: { label: string; index: number }[] = [];
  result.push({ label: labels[0], index: 0 });
  const inner = maxLabels - 2;
  for (let i = 1; i <= inner; i++) {
    const idx = Math.round((i / (inner + 1)) * (labels.length - 1));
    result.push({ label: labels[idx], index: idx });
  }
  result.push({ label: labels[labels.length - 1], index: labels.length - 1 });
  return result;
}

function FullWidthBarChart({ data, labels }: { data: number[]; labels: string[] }) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const barCount = data.length;
  const yAxisW = 30;
  const yAxisRightW = 30;
  const xAxisH = 16;
  const chartH = 80;
  const totalW = 600;
  const plotW = totalW - yAxisW - yAxisRightW;
  const totalH = chartH + xAxisH;
  const barGap = plotW * 0.006;
  const barW = (plotW - barGap * (barCount + 1)) / barCount;

  const yTicks = [0, Math.round(max / 2), max];

  const xLabels = pickAxisLabels(
    labels.length === data.length ? labels : data.map((_, i) => String(i + 1)),
    Math.min(10, barCount),
  );

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      {/* Y-axis left labels + gridlines */}
      {yTicks.map((tick) => {
        const y = chartH - (tick / max) * (chartH - 4);
        return (
          <g key={`yl-${tick}`}>
            <text
              x={yAxisW - 3}
              y={y + 3}
              textAnchor="end"
              fill="rgba(255,255,255,0.25)"
              fontSize="8"
              fontFamily="ui-monospace, monospace"
            >
              {formatAxisValue(tick)}
            </text>
            <line
              x1={yAxisW}
              y1={y}
              x2={totalW - yAxisRightW}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3,3"
            />
          </g>
        );
      })}

      {/* Y-axis right labels */}
      {yTicks.map((tick) => {
        const y = chartH - (tick / max) * (chartH - 4);
        return (
          <text
            key={`yr-${tick}`}
            x={totalW - yAxisRightW + 3}
            y={y + 3}
            textAnchor="start"
            fill="rgba(255,255,255,0.2)"
            fontSize="8"
            fontFamily="ui-monospace, monospace"
          >
            {formatAxisValue(tick)}
          </text>
        );
      })}

      {/* Bars */}
      {data.map((value, i) => {
        const barH = Math.max(0.5, (value / max) * (chartH - 4));
        const x = yAxisW + barGap + i * (barW + barGap);
        return (
          <rect
            key={i}
            x={x}
            y={chartH - barH}
            width={barW}
            height={barH}
            fill="rgba(255,255,255,0.7)"
            opacity={0.5 + (value / max) * 0.5}
            rx={0}
          />
        );
      })}

      {/* X-axis baseline */}
      <line
        x1={yAxisW}
        y1={chartH}
        x2={totalW - yAxisRightW}
        y2={chartH}
        stroke="rgba(255,255,255,0.1)"
      />

      {/* X-axis labels */}
      {xLabels.map(({ label, index }) => {
        const x = yAxisW + barGap + index * (barW + barGap) + barW / 2;
        return (
          <text
            key={`xl-${index}`}
            x={x}
            y={chartH + 12}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize="7.5"
            fontFamily="ui-monospace, monospace"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function PercentageBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono ${
        isPositive ? "text-green-400" : "text-red-400"
      }`}
    >
      <svg
        className={`w-2.5 h-2.5 ${!isPositive ? "rotate-180" : ""}`}
        viewBox="0 0 12 12"
        fill="currentColor"
      >
        <path d="M6 0 L12 12 L0 12 Z" />
      </svg>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function CardScaleWrapper({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={containerRef} style={{ width: "100%", maxWidth: width, margin: "0 auto" }}>
      <div
        style={{
          width,
          height: height * scale,
          overflow: "hidden",
        }}
      >
        <div style={{ width, transformOrigin: "top left", transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function useImageAsDataUrl(src: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled) setDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);
  return dataUrl;
}

export function ExportAnalyticsModal({
  open = true,
  defaultMode,
  onClose,
  initialMode = "overview",
}: ExportAnalyticsModalProps) {
  const effectiveInitialMode = defaultMode ?? initialMode;
  const [selectedModes, setSelectedModes] = useState<Set<Exclude<ExportMode, "overview">>>(
    new Set(INDIVIDUAL_MODES),
  );
  const [period, setPeriod] = useState("1W");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, AnalyticsData>>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { counts } = useCounts();

  const shaderDataUrl = useImageAsDataUrl(assetPath("/shaders.png"));
  const logoDataUrl = useImageAsDataUrl(assetPath("/logo.png"));

  const isAllSelected = INDIVIDUAL_MODES.every((m) => selectedModes.has(m));

  useEffect(() => {
    if (open) {
      if (effectiveInitialMode === "overview") {
        setSelectedModes(new Set(INDIVIDUAL_MODES));
      } else {
        setSelectedModes(new Set([effectiveInitialMode]));
      }
    }
  }, [open, effectiveInitialMode]);

  const toggleMode = (m: Exclude<ExportMode, "overview">) => {
    setSelectedModes((prev) => {
      const next = new Set(prev);
      if (next.has(m)) {
        if (next.size > 1) next.delete(m);
      } else {
        next.add(m);
      }
      return next;
    });
  };

  const toggleOverview = () => {
    setSelectedModes(new Set(INDIVIDUAL_MODES));
  };

  const mergedAnalyticsTypes = useMemo(() => {
    const seen = new Set<string>();
    const result: { type: string; label: string }[] = [];
    for (const mode of INDIVIDUAL_MODES) {
      if (!selectedModes.has(mode)) continue;
      for (const at of MODE_ANALYTICS[mode].analyticsTypes) {
        if (!seen.has(at.type)) {
          seen.add(at.type);
          result.push(at);
        }
      }
    }
    return result;
  }, [selectedModes]);

  // const subtitle = useMemo(() => {
  //   if (isAllSelected) return "System-wide analytics summary";
  //   const parts = Array.from(selectedModes).map(
  //     (m) => MODE_ANALYTICS[m].subtitle,
  //   );
  //   return parts.join(" · ");
  // }, [selectedModes, isAllSelected]);

  const title = useMemo(() => {
    if (isAllSelected) return "OVERVIEW";
    return Array.from(selectedModes)
      .map((m) => m.toUpperCase())
      .join(" + ");
  }, [selectedModes, isAllSelected]);

  const footerStats = useMemo(() => {
    const seen = new Set<string>();
    const result: { key: CountKey; label: string }[] = [];
    for (const mode of INDIVIDUAL_MODES) {
      if (!selectedModes.has(mode)) continue;
      for (const stat of FOOTER_STAT_MAP[mode] || []) {
        if (!seen.has(stat.key)) {
          seen.add(stat.key);
          result.push(stat);
        }
      }
    }
    return result;
  }, [selectedModes]);

  const fetchAnalytics = useCallback(async (type: string, p: string, from?: Date, to?: Date) => {
    const params = new URLSearchParams({ type, period: p });
    if (from) params.append("from", from.toISOString());
    if (to) params.append("to", to.toISOString());
    const response = await fetch(`/api/analytics?${params.toString()}`);
    return (await response.json()) as AnalyticsData;
  }, []);

  useEffect(() => {
    if (!open || mergedAnalyticsTypes.length === 0) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          mergedAnalyticsTypes.map((at) => fetchAnalytics(at.type, period, dateFrom, dateTo)),
        );
        if (cancelled) return;
        const map: Record<string, AnalyticsData> = {};
        mergedAnalyticsTypes.forEach((at, i) => {
          map[at.type] = results[i];
        });
        setAnalyticsMap(map);
      } catch {
        if (!cancelled) setAnalyticsMap({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, mergedAnalyticsTypes, period, dateFrom, dateTo, fetchAnalytics]);

  const handleExport = async (action: "download" | "clipboard") => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: "#000000",
        width: 740,
        height: 380,
        canvasWidth: 740 * 3,
        canvasHeight: 380 * 3,
      });

      if (action === "download") {
        const link = document.createElement("a");
        link.download = `better-auth-analytics-${Array.from(selectedModes).join("-")}-${format(new Date(), "yyyy-MM-dd")}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Image downloaded");
      } else {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast.success("Copied to clipboard");
      }
    } catch {
      toast.error("Failed to export image");
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  const primaryType = mergedAnalyticsTypes[0];
  const primaryAnalytics = primaryType ? analyticsMap[primaryType.type] : undefined;
  const chartData = primaryAnalytics?.data || [];
  const chartLabels = primaryAnalytics?.labels || [];

  const periodLabel =
    period === "Custom"
      ? dateFrom && dateTo
        ? `${format(dateFrom, "MMM dd")} - ${format(dateTo, "MMM dd, yyyy")}`
        : "Custom Range"
      : `Last ${PERIODS.find((p) => p.id === period)?.label || period}`;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-3 md:p-6">
      <div className="bg-black border border-white/15 rounded-none w-full max-w-5xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
          <div>
            <h3 className="text-base md:text-lg text-white font-light uppercase font-mono tracking-wider">
              Export Analytics
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-1">
              Generate shareable analytics images
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded-none"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="p-4 md:px-6 border-b border-white/10 space-y-3">
          {/* Mode Multi-select */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={toggleOverview}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                isAllSelected
                  ? "bg-white text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              Overview
            </button>
            {INDIVIDUAL_MODES.map((m) => (
              <button
                key={m}
                onClick={() => toggleMode(m)}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  selectedModes.has(m)
                    ? "bg-white text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Period + Date Range */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-px">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    period === p.id
                      ? "bg-white/20 text-white"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setPeriod("Custom")}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  period === "Custom"
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                }`}
              >
                Custom
              </button>
            </div>

            {period === "Custom" && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-7 px-2 text-[10px] font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5 rounded-none"
                    >
                      <CalendarIcon className="mr-1 w-3 h-3" />
                      {dateFrom ? format(dateFrom, "MMM dd yyyy") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-black border-white/10">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="rounded-none"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-gray-600 text-xs">→</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-7 px-2 text-[10px] font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5 rounded-none"
                    >
                      <CalendarIcon className="mr-1 w-3 h-3" />
                      {dateTo ? format(dateTo, "MMM dd yyyy") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-black border-white/10">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="rounded-none"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">
            Preview
          </div>

          {/* Card always renders at 740×380; 10px blank margin outside the border */}
          <CardScaleWrapper width={740} height={380}>
            <div
              ref={cardRef}
              className="bg-black"
              style={{
                width: 740,
                height: 380,
                padding: 10,
              }}
            >
              <div
                className="relative overflow-hidden"
                style={{ width: "100%", height: "100%", background: "#000" }}
              >
                {shaderDataUrl && (
                  <img
                    src={shaderDataUrl}
                    alt=""
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0.02,
                      pointerEvents: "none",
                    }}
                  />
                )}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />

                {/* Top-left corner */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 20,
                    height: 1,
                    background: "rgba(255,255,255,0.2)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 1,
                    height: 20,
                    background: "rgba(255,255,255,0.2)",
                  }}
                />
                {/* Top-right corner */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 20,
                    height: 1,
                    background: "rgba(255,255,255,0.2)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 1,
                    height: 20,
                    background: "rgba(255,255,255,0.2)",
                  }}
                />
                {/* Bottom-left corner */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: 20,
                    height: 1,
                    background: "rgba(255,255,255,0.2)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: 1,
                    height: 20,
                    background: "rgba(255,255,255,0.2)",
                  }}
                />
                {/* Bottom-right corner */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 20,
                    height: 1,
                    background: "rgba(255,255,255,0.2)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 1,
                    height: 20,
                    background: "rgba(255,255,255,0.2)",
                  }}
                />

                <div
                  className="relative z-10 h-full flex flex-col"
                  style={{ padding: "20px 24px" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {logoDataUrl && (
                        <img src={logoDataUrl} alt="" style={{ width: 32, height: 32 }} />
                      )}
                      <div>
                        <div
                          className="text-white font-mono font-light tracking-widest uppercase"
                          style={{ fontSize: 14 }}
                        >
                          Better-Auth Studio
                        </div>
                        <div
                          className="text-white/40 font-mono tracking-wider uppercase"
                          style={{ fontSize: 9, marginTop: 2 }}
                        >
                          Summary of your analytics
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/30 font-mono text-[8px] tracking-wider uppercase">
                        {title}
                      </div>
                      <div className="text-white/70 font-mono text-[10px] tracking-wider uppercase">
                        {periodLabel}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{ marginTop: 12, marginBottom: 12, marginLeft: -24, marginRight: -24 }}
                  >
                    <div
                      style={{ height: 1, width: "100%", background: "rgba(255,255,255,0.1)" }}
                    />
                    <div
                      style={{
                        height: 12,
                        width: "100%",
                        background:
                          "repeating-linear-gradient(-45deg,#ffffff,#ffffff 1px,transparent 1px,transparent 6px)",
                        opacity: 0.04,
                      }}
                    />
                    <div
                      style={{ height: 1, width: "100%", background: "rgba(255,255,255,0.1)" }}
                    />
                  </div>

                  <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
                    <div className="flex flex-wrap" style={{ gap: "12px 24px" }}>
                      {mergedAnalyticsTypes.map((at) => {
                        const d = analyticsMap[at.type];
                        const total = d?.total ?? 0;
                        const pct = d?.percentageChange ?? 0;
                        return (
                          <div key={at.type} style={{ minWidth: 90 }}>
                            <div
                              className="text-white/40 font-mono tracking-wider uppercase"
                              style={{ fontSize: 8 }}
                            >
                              {at.label}
                            </div>
                            <div className="flex items-baseline" style={{ gap: 6, marginTop: 2 }}>
                              <span
                                className="text-white font-mono font-light"
                                style={{ fontSize: 18 }}
                              >
                                {loading ? "..." : total.toLocaleString()}
                              </span>
                              {!loading && <PercentageBadge value={pct} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {primaryType && (
                      <div style={{ marginTop: 16 }}>
                        <div
                          className="text-white/30 font-mono tracking-wider uppercase"
                          style={{ fontSize: 8, marginBottom: 6 }}
                        >
                          {primaryType.label} — Trend
                        </div>
                        {loading ? (
                          <div className="flex items-center justify-center" style={{ height: 80 }}>
                            <span className="text-white/20 font-mono" style={{ fontSize: 10 }}>
                              Loading...
                            </span>
                          </div>
                        ) : (
                          <div style={{ width: "100%" }}>
                            <FullWidthBarChart data={chartData} labels={chartLabels} />
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ flex: 1 }} />

                    <div>
                      <div
                        className="bg-white/10"
                        style={{ height: 1, width: "100%", marginBottom: 8 }}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center" style={{ gap: 16 }}>
                          {footerStats.map((stat) => (
                            <div
                              key={stat.key}
                              className="text-white/25 font-mono tracking-wider uppercase"
                              style={{ fontSize: 8 }}
                            >
                              {stat.label}:{" "}
                              {(counts as unknown as Record<string, number | undefined>)[
                                stat.key
                              ]?.toLocaleString() ?? "—"}
                            </div>
                          ))}
                        </div>
                        <div
                          className="text-white/20 font-mono tracking-wider uppercase"
                          style={{ fontSize: 7 }}
                        >
                          {format(new Date(), "MMM dd, yyyy · HH:mm")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardScaleWrapper>

          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              onClick={onClose}
              className="border border-dashed border-white/20 bg-transparent text-white hover:bg-white/10 rounded-none font-mono uppercase font-medium text-xs tracking-tight"
            >
              Close
            </Button>
            <Button
              onClick={() => handleExport("clipboard")}
              disabled={exporting || loading}
              className="border border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-none font-mono uppercase font-medium text-xs tracking-tight gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              {exporting ? "Exporting..." : "Copy to Clipboard"}
            </Button>
            <Button
              onClick={() => handleExport("download")}
              disabled={exporting || loading}
              className="border border-white/20 bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase font-medium text-xs tracking-tight gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? "Exporting..." : "Download PNG"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
