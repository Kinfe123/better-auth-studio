import { addDays, format, startOfWeek, subWeeks } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  Calendar as CalendarIcon,
  Computer,
  Eye,
  Filter,
  Loader,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { CodeBlock } from "../components/CodeBlock";
import { CopyableId } from "../components/CopyableId";
import {
  AlertInfo,
  AlertTriangle,
  Analytics,
  Building2,
  Check,
  ErrorInfo,
  Info,
  Users,
} from "../components/PixelIcons";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { buildApiUrl } from "../utils/api";

const EVENT_TYPES = [
  "user.joined",
  "user.logged_in",
  "user.updated",
  "user.logged_out",
  "user.password_changed",
  "user.email_verified",
  "user.banned",
  "user.unbanned",
  "user.deleted",
  "user.delete_verification_requested",
  "organization.created",
  "organization.deleted",
  "organization.updated",
  "member.added",
  "member.removed",
  "member.role_changed",
  "session.created",
  "password.reset_requested",
  "password.reset_completed",
  "password.reset_requested_otp",
  "password.reset_completed_otp",
  "oauth.linked",
  "oauth.unlinked",
  "oauth.sign_in",
  "team.created",
  "team.updated",
  "team.deleted",
  "team.member.added",
  "team.member.removed",
  "invitation.created",
  "invitation.accepted",
  "invitation.rejected",
  "invitation.cancelled",
  "phone_number.otp_requested",
  "phone_number.verification",
] as const;

/** Category is the first segment of event type (e.g. "user.joined" -> "user"). */
const getEventCategory = (eventType: string): string => {
  const dot = eventType.indexOf(".");
  return dot === -1 ? eventType : eventType.slice(0, dot);
};

const EVENT_CATEGORY_ORDER = [
  "user",
  "organization",
  "member",
  "session",
  "password",
  "oauth",
  "team",
  "invitation",
  "phone_number",
] as const;

const EVENT_CATEGORY_LABELS: Record<string, string> = {
  user: "User",
  organization: "Organization",
  member: "Member",
  session: "Session",
  password: "Password",
  oauth: "OAuth",
  team: "Team",
  invitation: "Invitation",
  phone_number: "Phone number",
};

interface AuthEvent {
  id: string;
  type: string;
  timestamp: string | Date;
  status?: "success" | "failed";
  userId?: string;
  sessionId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  source?: "app" | "api";
  display?: {
    message: string;
    severity?: "info" | "success" | "warning" | "failed";
  };
}

const formatDateTime = (value?: string | Date) => {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";

  const month = format(d, "MMM").toUpperCase();
  const day = format(d, "dd");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const milliseconds = String(d.getMilliseconds()).padStart(2, "0").slice(0, 2);

  return `${month} ${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const getSeverityColor = (severity?: string, status?: string) => {
  if (status === "failed") {
    return "text-red-400/70 border-white/15 bg-white/5";
  }
  switch (severity) {
    case "success":
      return "text-green-400/70 border-white/15 bg-white/5";
    case "warning":
      return "text-yellow-400/70 border-white/15 bg-white/5";
    case "failed":
      return "text-red-400/70 border-white/15 bg-white/5";
    default:
      return "text-blue-400/70 border-white/15 bg-white/5";
  }
};

const getEventIcon = (eventType: string, severity?: string, status?: string) => {
  if (
    eventType.includes("organization") ||
    eventType.includes("member") ||
    eventType.includes("team") ||
    eventType.includes("invitation")
  ) {
    return <Building2 className="w-4 h-4" />;
  }

  if (eventType.includes("user")) {
    return <Users className="w-4 h-4" />;
  }

  if (eventType.includes("session") || eventType.includes("login")) {
    return <Computer className="w-4 h-4" />;
  }

  if (status === "failed" || severity === "failed") {
    return <AlertTriangle className="w-4 h-4" />;
  }
  switch (severity) {
    case "success":
      return <Check className="w-4 h-4" />;
    case "warning":
      return <AlertInfo className="w-4 h-4" />;
    case "failed":
      return <ErrorInfo className="w-4 h-4" />;
    default:
      return <ErrorInfo className="w-4 h-4" />;
  }
};

function getStudioConfig() {
  return (window as any).__STUDIO_CONFIG__ || {};
}

function checkIsSelfHosted(): boolean {
  const cfg = getStudioConfig();
  return !!cfg.basePath;
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuthEvent | null>(null);
  const [_, setIsConnected] = useState(false);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const pollTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);
  const lastEventIdRef = useRef<string | null>(null);
  const pollInterval = 2000; // 2 seconds
  const [isSelfHosted, setIsSelfHosted] = useState(false);
  const [eventsEnabled, setEventsEnabled] = useState<boolean | null>(null);
  const [checkingEvents, setCheckingEvents] = useState(true);
  const [selectedActivityDateKey, setSelectedActivityDateKey] = useState<string | null>(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const activityDetailsScrollRef = useRef<HTMLDivElement>(null);
  const [activityDetailsCanScroll, setActivityDetailsCanScroll] = useState(false);

  interface FilterConfig {
    type: string;
    dateRange?: DateRange;
    eventTypes?: string[];
  }

  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>([]);
  const [eventSort, setEventSort] = useState<"newest" | "oldest">("newest");

  const eventStats = useMemo(() => {
    // Use the same categorization logic as the chart
    const failed = events.filter((e) => {
      const status = e.status || "success";
      const severity = e.display?.severity;
      return status === "failed" || severity === "failed";
    }).length;

    const warning = events.filter((e) => {
      const severity = e.display?.severity;
      return severity === "warning";
    }).length;

    const info = events.filter((e) => {
      const status = e.status || "success";
      const severity = e.display?.severity;
      return severity === "info" || (!severity && status !== "failed");
    }).length;

    const success = events.filter((e) => {
      const status = e.status || "success";
      const severity = e.display?.severity;
      const isFailed = status === "failed" || severity === "failed";
      const isWarning = severity === "warning";
      const isInfo = severity === "info" || (!severity && status !== "failed");
      return status === "success" && !isFailed && !isWarning && !isInfo;
    }).length;

    return { success, failed, warning, info };
  }, [events]);

  const fetchEvents = useCallback(async (isInitial = false) => {
    if (isPollingRef.current && !isInitial) return;
    isPollingRef.current = true;

    try {
      const params = new URLSearchParams({
        limit: "50",
        sort: "desc",
      });

      const apiPath = buildApiUrl("/api/events");
      const response = await fetch(`${apiPath}?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 500) {
          try {
            const errorData = await response.json();
            if (
              errorData.details?.includes("not found in schema") ||
              errorData.details?.includes("Model")
            ) {
              setIsConnected(true);
              if (isInitial) {
                setEvents([]);
                setLoading(false);
              }
              return;
            }
          } catch {}
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setIsConnected(true);

      if (data.events && Array.isArray(data.events)) {
        if (data.events.length === 0 && isInitial) {
          setEvents([]);
          setLoading(false);
          return;
        }
        if (isInitial) {
          setEvents(data.events);
          if (data.events.length > 0) {
            lastEventIdRef.current = data.events[0].id;
          }
        } else {
          setEvents((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newEvents = data.events.filter((event: AuthEvent) => !existingIds.has(event.id));

            if (newEvents.length > 0) {
              const newIds = new Set<string>(newEvents.map((e: AuthEvent) => e.id));
              setNewEventIds((prevIds) => {
                const combined = new Set<string>([...prevIds, ...newIds]);
                setTimeout(() => {
                  setNewEventIds((prevSet) => {
                    const updated = new Set<string>(prevSet);
                    newIds.forEach((id: string) => updated.delete(id));
                    return updated;
                  });
                }, 3000);
                return combined;
              });

              const updated = [...newEvents, ...prev];
              return updated.slice(0, 100);
            }

            return prev;
          });

          if (data.events.length > 0) {
            lastEventIdRef.current = data.events[0].id;
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setIsConnected(false);
    } finally {
      isPollingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkConfig = async () => {
      const selfHosted = checkIsSelfHosted();
      setIsSelfHosted(selfHosted);

      if (!selfHosted) {
        setEventsEnabled(false);
        setCheckingEvents(false);
        return;
      }

      try {
        const response = await fetch(buildApiUrl("/api/events/status"));
        const data = await response.json();
        setEventsEnabled(data?.enabled === true);
      } catch (error) {
        console.error("Failed to check events status:", error);
        setEventsEnabled(false);
      } finally {
        setCheckingEvents(false);
      }
    };

    checkConfig();
  }, []);

  useEffect(() => {
    if (showViewModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showViewModal]);

  useEffect(() => {
    if (checkingEvents) {
      return;
    }

    if (!eventsEnabled || !isSelfHosted) {
      setLoading(false);
      return;
    }

    fetchEvents(true);

    const startPolling = () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }

      pollTimeoutRef.current = setInterval(() => {
        fetchEvents(false);
      }, pollInterval);
    };

    startPolling();

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
    };
  }, [eventsEnabled, isSelfHosted, checkingEvents, fetchEvents]);

  useEffect(() => {
    if (!selectedActivityDateKey || events.length === 0) {
      setActivityDetailsCanScroll(false);
      return;
    }
    const el = activityDetailsScrollRef.current;
    if (!el) return;
    const check = () => {
      setActivityDetailsCanScroll(el.scrollHeight > el.clientHeight);
    };
    const raf = requestAnimationFrame(() => check());
    const ro = new ResizeObserver(check);
    ro.observe(el);
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4;
      setActivityDetailsCanScroll(!atBottom && el.scrollHeight > el.clientHeight);
    };
    el.addEventListener("scroll", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [selectedActivityDateKey, events.length]);

  const openViewModal = (event: AuthEvent) => {
    setSelectedEvent(event);
    setShowViewModal(true);
  };

  const addFilter = (filterType: string) => {
    const exists = activeFilters.some((f) => f.type === filterType);
    if (!exists) {
      if (filterType === "eventType") {
        setActiveFilters((prev) => [...prev, { type: filterType, eventTypes: [] }]);
      } else {
        setActiveFilters((prev) => [...prev, { type: filterType }]);
      }
    }
  };

  const removeFilter = (filterType: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.type !== filterType));
  };

  const updateFilterDateRange = (filterType: string, dateRange?: DateRange) => {
    setActiveFilters((prev) => prev.map((f) => (f.type === filterType ? { ...f, dateRange } : f)));
  };

  const updateEventTypes = (filterType: string, eventTypes: string[]) => {
    setActiveFilters((prev) => prev.map((f) => (f.type === filterType ? { ...f, eventTypes } : f)));
  };

  const toggleEventType = (filterType: string, eventType: string) => {
    const filter = activeFilters.find((f) => f.type === filterType);
    if (!filter) return;

    const currentTypes = filter.eventTypes || [];
    const newTypes = currentTypes.includes(eventType)
      ? currentTypes.filter((t) => t !== eventType)
      : [...currentTypes, eventType];

    updateEventTypes(filterType, newTypes);
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.display?.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "success" && event.status === "success") ||
      (filter === "failed" && event.status === "failed") ||
      (filter === "info" && event.display?.severity === "info") ||
      (filter === "warning" && event.display?.severity === "warning");

    // Apply active filters
    if (activeFilters.length > 0) {
      const matchesActiveFilters = activeFilters.every((filter) => {
        if (filter.type === "timestamp") {
          if (!filter.dateRange?.from && !filter.dateRange?.to) return true;
          const eventDate = new Date(event.timestamp);
          if (filter.dateRange?.from) {
            const fromDate = new Date(filter.dateRange.from);
            fromDate.setHours(0, 0, 0, 0);
            if (fromDate > eventDate) return false;
          }
          if (filter.dateRange?.to) {
            const toDate = new Date(filter.dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            if (toDate < eventDate) return false;
          }
          return true;
        }
        if (filter.type === "eventType") {
          if (!filter.eventTypes || filter.eventTypes.length === 0) return true;
          return filter.eventTypes.includes(event.type);
        }
        return true;
      });

      return matchesSearch && matchesFilter && matchesActiveFilters;
    }

    return matchesSearch && matchesFilter;
  });

  const sortedEvents = useMemo(() => {
    const list = [...filteredEvents];
    list.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return eventSort === "newest" ? tb - ta : ta - tb;
    });
    return list;
  }, [filteredEvents, eventSort]);

  if (checkingEvents) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="w-6 h-6 text-white animate-spin" />
          <div className="text-white text-sm">Checking configuration...</div>
        </div>
      </div>
    );
  }

  if (!isSelfHosted || !eventsEnabled) {
    const exampleCode = `import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { studio } from '@better-auth/studio';
import { prisma } from './db';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.AUTH_SECRET!,
  baseURL: process.env.AUTH_URL,
  plugins: [
    studio({
      events: {
        enabled: true,
        client: prisma,
        clientType: 'prisma',
        tableName: 'auth_events',
      },
    }),
  ],
});`;

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl relative text-white font-light inline-flex items-start">
              Events
            </h1>
            <p className="text-gray-400 mt-1 uppercase font-mono text-sm font-light">
              Real-time authentication events and activity
            </p>
          </div>
        </div>

        <div className="bg-black/30 border border-dashed border-white/20 rounded-none p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center space-x-3">
              <div className="text-left">
                <h2 className="text-xl text-white font-mono font-light mb-2">
                  Event Ingestion Not Enabled
                </h2>
                <p className="text-gray-400 text-sm font-mono">
                  {!isSelfHosted
                    ? "Event ingestion is only available in self-hosted mode."
                    : "Please enable event ingestion in your studio configuration to view events."}
                </p>
              </div>
            </div>

            {isSelfHosted && (
              <div className="w-full max-w-4xl">
                <div className="mb-4">
                  <p className="text-gray-300 text-sm font-mono mb-2">
                    Add the following configuration to your{" "}
                    <code className="text-yellow-400">studio.config.ts</code>:
                  </p>
                </div>
                <CodeBlock
                  code={exampleCode}
                  language="typescript"
                  fileName="studio.config.ts"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="w-6 h-6 text-white animate-spin" />
          <div className="text-white text-sm">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 w-full max-w-full min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl relative text-white font-light inline-flex items-start">
            Events
            <sup className="text-xs text-gray-500 ml-1 mt-0">
              <span className="mr-1">[</span>
              <span className="text-white font-mono text-sm">{events.length}</span>
              <span className="ml-1">]</span>
            </sup>
          </h1>
          <p className="text-gray-400 mt-1 uppercase font-mono text-sm font-light">
            Real-time authentication events and activity
          </p>
        </div>
      </div>

      <div
        className={`flex items-center justify-between gap-8 py-4 px-6 bg-gradient-to-b from-white/[4%] to-white/[2.5%] border border-white/10 rounded-none overflow-x-auto relative`}
      >
        <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/20" />
        <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/20" />
        <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/20" />
        <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/20" />
        <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/20" />
        <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/20" />
        <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/20" />
        <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/20" />

        <div className="flex items-center gap-3 min-w-fit">
          <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0 ">
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm uppercase tracking-wide">Success</span>
            <span className="text-white text-lg font-medium">{eventStats.success}</span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex items-center gap-3 min-w-fit">
          <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
            <ErrorInfo className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm uppercase tracking-wide">Failed</span>
            <span className="text-white text-lg font-medium">{eventStats.failed}</span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex items-center gap-3 min-w-fit">
          <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
            <AlertInfo className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm uppercase tracking-wide">Warning</span>
            <span className="text-white text-lg font-medium">{eventStats.warning}</span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex items-center gap-3 min-w-fit">
          <div className="w-10 h-10 rounded-none bg-white/5 border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm uppercase tracking-wide">Info</span>
            <span className="text-white text-lg font-medium">{eventStats.info}</span>
          </div>
        </div>
      </div>

      {/* Event activity grid (GitHub-style, full year) */}
      {events.length > 0 &&
        (() => {
          const WEEKS = 53;
          const DAYS = 7;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const weekStart = startOfWeek(today, { weekStartsOn: 0 });
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];

          type CellData = {
            dateKey: string;
            dateLabel: string;
            success: number;
            failed: number;
            warning: number;
            info: number;
          };
          const cells: CellData[] = [];
          const byDate: Record<
            string,
            { success: number; failed: number; warning: number; info: number }
          > = {};

          // Week start dates for each column: col 0 = 52 weeks ago, col 52 = this week
          const weekStartsByCol: Date[] = [];
          for (let col = 0; col < WEEKS; col++) {
            weekStartsByCol.push(subWeeks(weekStart, WEEKS - 1 - col));
          }

          // Month labels: show month at first column where that month appears
          const monthLabelsByCol: string[] = [];
          let lastMonth = -1;
          for (let col = 0; col < WEEKS; col++) {
            const d = weekStartsByCol[col];
            const month = d.getMonth();
            monthLabelsByCol.push(month !== lastMonth ? monthNames[month] : "");
            lastMonth = month;
          }

          const leftYear = weekStartsByCol[0].getFullYear();
          const rightYear = today.getFullYear();

          const safeDateLabel = (d: Date) => {
            if (Number.isNaN(d.getTime())) return "Invalid date";
            return format(d, "EEE, MMM d, yyyy");
          };

          // Build grid row-major: row = day (Sun–Sat), col = week
          for (let row = 0; row < DAYS; row++) {
            for (let col = 0; col < WEEKS; col++) {
              const weekStartDate = weekStartsByCol[col];
              const d = addDays(weekStartDate, row);
              const dateKey = Number.isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd");
              if (dateKey && !byDate[dateKey] && d <= today) {
                byDate[dateKey] = { success: 0, failed: 0, warning: 0, info: 0 };
              }
              cells.push({
                dateKey,
                dateLabel: safeDateLabel(d),
                success: 0,
                failed: 0,
                warning: 0,
                info: 0,
              });
            }
          }

          events.forEach((event) => {
            const eventDate = new Date(event.timestamp);
            eventDate.setHours(0, 0, 0, 0);
            const key = format(eventDate, "yyyy-MM-dd");
            if (!byDate[key]) return;
            const status = event.status || "success";
            const severity = event.display?.severity;
            const isFailed = status === "failed" || severity === "failed";
            const isWarning = severity === "warning";
            const isInfo = severity === "info" || (!severity && status !== "failed");
            const isSuccess = status === "success" && !isFailed && !isWarning && !isInfo;
            if (isFailed) byDate[key].failed++;
            else if (isWarning) byDate[key].warning++;
            else if (isInfo) byDate[key].info++;
            else if (isSuccess) byDate[key].success++;
          });

          cells.forEach((cell) => {
            const d = byDate[cell.dateKey];
            if (d) {
              cell.success = d.success;
              cell.failed = d.failed;
              cell.warning = d.warning;
              cell.info = d.info;
            }
          });

          const maxTotal = Math.max(
            ...cells.map((c) => c.success + c.failed + c.warning + c.info),
            1,
          );

          const getCellIntensity = (cell: CellData) => {
            const total = cell.success + cell.failed + cell.warning + cell.info;
            if (total === 0) return "bg-white/5";
            const ratio = total / maxTotal;
            if (ratio <= 0.25) return "bg-white/15";
            if (ratio <= 0.5) return "bg-white/25";
            if (ratio <= 0.75) return "bg-white/35";
            return "bg-white/50";
          };

          const cellGap = 4;
          const cellSize = 10;
          const monthRowHeight = 22;
          const gridWidth = WEEKS * cellSize + (WEEKS - 1) * cellGap;

          const eventsForDate = selectedActivityDateKey
            ? events.filter((e) => {
                const d = new Date(e.timestamp);
                d.setHours(0, 0, 0, 0);
                return format(d, "yyyy-MM-dd") === selectedActivityDateKey;
              })
            : [];
          const byCategoryForDate = (() => {
            const acc: Record<
              string,
              { success: number; failed: number; warning: number; info: number; total: number }
            > = {};
            for (const e of eventsForDate) {
              const cat = getEventCategory(e.type);
              const label = EVENT_CATEGORY_LABELS[cat] || cat;
              if (!acc[label])
                acc[label] = { success: 0, failed: 0, warning: 0, info: 0, total: 0 };
              acc[label].total++;
              const status = e.status || "success";
              const severity = e.display?.severity;
              const isFailed = status === "failed" || severity === "failed";
              const isWarning = severity === "warning";
              const isInfo = severity === "info" || (!severity && status !== "failed");
              const isSuccess = status === "success" && !isFailed && !isWarning && !isInfo;
              if (isFailed) acc[label].failed++;
              else if (isWarning) acc[label].warning++;
              else if (isInfo) acc[label].info++;
              else if (isSuccess) acc[label].success++;
            }
            return acc;
          })();
          const selectedCell = cells.find((c) => c.dateKey === selectedActivityDateKey);

          return (
            <div className="bg-gradient-to-b from-white/[4%] to-white/[2.5%] border border-white/10 rounded-none p-6 relative w-full max-w-full">
              <div className="absolute top-0 left-0 w-[12px] h-[0.5px] bg-white/20" />
              <div className="absolute top-0 left-0 w-[0.5px] h-[12px] bg-white/20" />
              <div className="absolute top-0 right-0 w-[12px] h-[0.5px] bg-white/20" />
              <div className="absolute top-0 right-0 w-[0.5px] h-[12px] bg-white/20" />
              <div className="absolute bottom-0 left-0 w-[12px] h-[0.5px] bg-white/20" />
              <div className="absolute bottom-0 left-0 w-[0.5px] h-[12px] bg-white/20" />
              <div className="absolute bottom-0 right-0 w-[12px] h-[0.5px] bg-white/20" />
              <div className="absolute bottom-0 right-0 w-[0.5px] h-[12px] bg-white/20" />

              <div className="flex w-full min-w-0 items-start">
                <div className="shrink-0 flex flex-col pr-6 border-r border-white/15">
                  <h3 className="text-sm text-white uppercase font-light mb-2">Event activity</h3>
                  <p className="text-xs text-gray-500 font-mono uppercase mb-4">
                    Click a cell to see more details
                  </p>

                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className="flex flex-col shrink-0 text-[10px] text-gray-500 font-mono"
                      style={{ width: 28 }}
                    >
                      <div
                        style={{ height: monthRowHeight, minHeight: monthRowHeight }}
                        aria-hidden
                      />
                      {dayNames.map((name) => (
                        <div
                          key={name}
                          className="flex items-center justify-start leading-none"
                          style={{ height: cellSize, marginBottom: name !== "Sat" ? cellGap : 0 }}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                    <div className="shrink-0" style={{ width: gridWidth }}>
                      {/* Month labels - GitHub style: Jan, Feb, Mar ... aligned with first week of each month */}
                      <div
                        className="grid mb-2"
                        style={{
                          gridTemplateColumns: `repeat(${WEEKS}, ${cellSize}px)`,
                          gap: `0 ${cellGap}px`,
                          width: gridWidth,
                        }}
                      >
                        {monthLabelsByCol.map((label, col) => (
                          <span
                            key={col}
                            className="text-[10px] text-gray-500 font-mono text-left"
                            style={{ gridColumn: col + 1 }}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                      <div
                        className="grid relative"
                        style={{
                          gridTemplateRows: `repeat(${DAYS}, ${cellSize}px)`,
                          gridTemplateColumns: `repeat(${WEEKS}, ${cellSize}px)`,
                          gap: cellGap,
                          width: gridWidth,
                        }}
                      >
                        {cells.map((cell, index) => {
                          const isFuture =
                            cell.dateKey && cell.dateKey > format(today, "yyyy-MM-dd");
                          const isSelected = cell.dateKey === selectedActivityDateKey;
                          return (
                            <div
                              key={`${cell.dateKey}-${index}`}
                              className={`rounded-[2px] border border-white/10 transition-all duration-150 cursor-pointer hover:ring-1 hover:ring-white/40 size-full min-w-0 min-h-0 ${getCellIntensity(cell)} ${isFuture ? "opacity-40" : ""} ${isSelected ? "ring-2 ring-white/60" : ""}`}
                              onClick={() => setSelectedActivityDateKey(cell.dateKey)}
                            />
                          );
                        })}
                      </div>
                      {/* Year labels: last year (left), current year (right) — GitHub style */}
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2 px-0.5">
                        <span>{leftYear}</span>
                        <span>{leftYear !== rightYear ? rightYear : "Today"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity details panel — height matches activity map, no stretch */}
                <div className="flex-1 min-w-0 flex flex-col pl-5 min-h-0 overflow-hidden max-h-[200px] relative">
                  {selectedActivityDateKey ? (
                    <p className="text-sm text-white/80 font-light font-mono uppercase shrink-0 mb-3">
                      {selectedCell?.dateLabel ?? selectedActivityDateKey}
                    </p>
                  ) : (
                    <p className="text-xs font-mono uppercase text-gray-500 shrink-0 mb-3">
                      Click a cell to see more details
                    </p>
                  )}
                  <div
                    ref={activityDetailsScrollRef}
                    className="activity-details-scroll flex-1 overflow-y-auto min-h-0 overscroll-contain"
                  >
                    {!selectedActivityDateKey ? (
                      <p className="text-xs font-mono text-gray-500">
                        Select a day from the grid to view events by category and status.
                      </p>
                    ) : eventsForDate.length === 0 ? (
                      <p className="text-xs font-mono text-gray-500">No events on this day</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-white/10">
                          <div className="flex items-center space-x-3">
                            <Analytics className="w-4 h-4 text-white shrink-0" />
                            <div>
                              <p className="text-xs font-light uppercase text-white">
                                Total events
                              </p>
                              <p className="text-[10px] font-light uppercase font-mono text-gray-400">
                                This day
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-white">
                            {eventsForDate.length}
                          </span>
                        </div>
                        {selectedCell && (
                          <>
                            {selectedCell.success > 0 && (
                              <div className="flex items-center justify-between py-2 border-b border-white/10">
                                <span className="text-xs font-mono uppercase text-gray-400">
                                  Success
                                </span>
                                <span className="text-xs font-mono text-green-400">
                                  {selectedCell.success}
                                </span>
                              </div>
                            )}
                            {selectedCell.failed > 0 && (
                              <div className="flex items-center justify-between py-2 border-b border-white/10">
                                <span className="text-xs font-mono uppercase text-gray-400">
                                  Failed
                                </span>
                                <span className="text-xs font-mono text-red-400">
                                  {selectedCell.failed}
                                </span>
                              </div>
                            )}
                            {selectedCell.warning > 0 && (
                              <div className="flex items-center justify-between py-2 border-b border-white/10">
                                <span className="text-xs font-mono uppercase text-gray-400">
                                  Warning
                                </span>
                                <span className="text-xs font-mono text-yellow-400">
                                  {selectedCell.warning}
                                </span>
                              </div>
                            )}
                            {selectedCell.info > 0 && (
                              <div className="flex items-center justify-between py-2 border-b border-white/10">
                                <span className="text-xs font-mono uppercase text-gray-400">
                                  Info
                                </span>
                                <span className="text-xs font-mono text-blue-400">
                                  {selectedCell.info}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="pt-2 mt-2">
                          <p className="text-[10px] font-light uppercase font-mono text-gray-500 mb-2">
                            By category
                          </p>
                          {[
                            ...EVENT_CATEGORY_ORDER.filter(
                              (cat) => byCategoryForDate[EVENT_CATEGORY_LABELS[cat]],
                            ),
                            ...Object.keys(byCategoryForDate).filter(
                              (k) =>
                                !EVENT_CATEGORY_ORDER.some((c) => EVENT_CATEGORY_LABELS[c] === k),
                            ),
                          ].map((catOrKey) => {
                            const label =
                              typeof catOrKey === "string" && EVENT_CATEGORY_LABELS[catOrKey]
                                ? EVENT_CATEGORY_LABELS[catOrKey]
                                : catOrKey;
                            const stats = byCategoryForDate[label];
                            if (!stats || stats.total === 0) return null;
                            return (
                              <div
                                key={label}
                                className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                              >
                                <div>
                                  <p className="text-xs font-light uppercase text-white">{label}</p>
                                  <p className="text-[10px] font-mono text-gray-400">
                                    Success {stats.success}
                                    {stats.failed > 0 && ` · Failed ${stats.failed}`}
                                    {stats.warning > 0 && ` · Warning ${stats.warning}`}
                                    {stats.info > 0 && ` · Info ${stats.info}`}
                                  </p>
                                </div>
                                <span className="text-xs font-mono text-white">{stats.total}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  {activityDetailsCanScroll && (
                    <div
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/80 border border-white/20 text-[10px] font-mono uppercase text-white/80 pointer-events-none"
                      aria-hidden
                    >
                      <ArrowDown className="w-3 h-3 shrink-0" />
                      <span>Scroll for more</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
            />
          </div>

          <div className="flex w-[130px] items-center space-x-2">
            <Select value={filter} className="w-full" onValueChange={setFilter}>
              <SelectTrigger className="w-full font-mono uppercase sm:text-[11px] border border-dashed border-white/20 bg-black/30 text-white rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-mono uppercase text-[11px]">
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Select value="" onValueChange={addFilter}>
              <SelectTrigger className="w-[120px] font-mono uppercase sm:text-[11px] border border-dashed border-white/20 bg-black/30 text-white rounded-none">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="Add Filter" className="pr-2" />
                </div>
              </SelectTrigger>
              <SelectContent className="font-mono uppercase text-[11px]">
                {!activeFilters.some((f) => f.type === "timestamp") && (
                  <SelectItem value="timestamp">Date Range</SelectItem>
                )}
                {!activeFilters.some((f) => f.type === "eventType") && (
                  <SelectItem value="eventType">Event Type</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <div
                key={filter.type}
                className="flex items-center gap-2 px-3 py-1.5 bg-black/50 border border-dashed border-white/20 rounded-none"
              >
                {filter.type === "timestamp" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-gray-400">Date:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-8 px-3 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {filter.dateRange?.from
                            ? format(filter.dateRange.from, "MMM dd yyyy")
                            : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={filter.dateRange?.from}
                          onSelect={(date) =>
                            updateFilterDateRange("timestamp", {
                              from: date,
                              to: filter.dateRange?.to,
                            })
                          }
                          initialFocus
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-8 px-3 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {filter.dateRange?.to ? format(filter.dateRange.to, "MMM dd yyyy") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10">
                        <Calendar
                          mode="single"
                          selected={filter.dateRange?.to}
                          onSelect={(date) =>
                            updateFilterDateRange("timestamp", {
                              from: filter.dateRange?.from,
                              to: date,
                            })
                          }
                          initialFocus
                          disabled={(date) =>
                            filter.dateRange?.from ? date < filter.dateRange.from : false
                          }
                          className="rounded-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {filter.type === "eventType" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-gray-400">Event Types:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-8 px-3 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                        >
                          {filter.eventTypes && filter.eventTypes.length > 0
                            ? `${filter.eventTypes.length} selected`
                            : "Select types"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-black border-white/10 max-h-[400px] overflow-y-auto">
                        <div className="p-3 space-y-2 min-w-[250px]">
                          <div className="text-xs font-mono uppercase text-gray-400 mb-2 px-2">
                            Select Event Types
                          </div>
                          <div className="space-y-3">
                            {EVENT_CATEGORY_ORDER.map((category) => {
                              const typesInCategory = EVENT_TYPES.filter(
                                (t) => getEventCategory(t) === category,
                              );
                              if (typesInCategory.length === 0) return null;
                              const label = EVENT_CATEGORY_LABELS[category] ?? category;
                              return (
                                <div key={category} className="space-y-1">
                                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 px-2 py-1 border-b border-dashed border-white/10">
                                    {label}
                                  </div>
                                  {typesInCategory.map((eventType) => {
                                    const isSelected =
                                      filter.eventTypes?.includes(eventType) || false;
                                    return (
                                      <label
                                        key={eventType}
                                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 cursor-pointer rounded-none"
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            toggleEventType("eventType", eventType)
                                          }
                                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white"
                                        />
                                        <span className="text-xs font-mono text-white">
                                          {eventType}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              );
                            })}
                            {EVENT_TYPES.filter(
                              (t) =>
                                !EVENT_CATEGORY_ORDER.includes(
                                  getEventCategory(t) as (typeof EVENT_CATEGORY_ORDER)[number],
                                ),
                            ).length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 px-2 py-1 border-b border-dashed border-white/10">
                                  Other
                                </div>
                                {EVENT_TYPES.filter(
                                  (t) =>
                                    !EVENT_CATEGORY_ORDER.includes(
                                      getEventCategory(t) as (typeof EVENT_CATEGORY_ORDER)[number],
                                    ),
                                ).map((eventType) => {
                                  const isSelected =
                                    filter.eventTypes?.includes(eventType) || false;
                                  return (
                                    <label
                                      key={eventType}
                                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 cursor-pointer rounded-none"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                          toggleEventType("eventType", eventType)
                                        }
                                        className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white"
                                      />
                                      <span className="text-xs font-mono text-white">
                                        {eventType}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <button
                  onClick={() => removeFilter(filter.type)}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-black/30 border border-dashed border-white/20 rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dashed border-white/10">
                <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                  Event
                </th>
                <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">Type</th>
                <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                  Status
                </th>
                <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">User</th>
                <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setEventSort((prev) => (prev === "newest" ? "oldest" : "newest"))
                    }
                    className="flex items-center gap-1.5 font-mono uppercase hover:text-white/90 transition-colors"
                  >
                    Timestamp
                    {eventSort === "newest" ? (
                      <ArrowDown className="w-3.5 h-3.5 text-white/70" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5 text-white/70" />
                    )}
                  </button>
                </th>
                <th className="text-right py-4 px-4 text-white font-mono uppercase text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No events found
                  </td>
                </tr>
              ) : (
                sortedEvents.map((event) => {
                  const isNew = newEventIds.has(event.id);
                  const severity = event.display?.severity || "info";
                  const status = event.status || "success";
                  const isSuccess = status === "success" && severity !== "failed";
                  const isFailed = status === "failed" || severity === "failed";

                  return (
                    <tr
                      key={event.id}
                      onClick={() => openViewModal(event)}
                      className={`border-b border-dashed border-white/5 hover:bg-white/5 transition-all cursor-pointer ${isNew ? (isSuccess ? "new-event-row bg-green-400/10 border-green-400/20" : isFailed ? "new-event-row bg-red-400/10 border-red-400/20" : "") : ""}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-none border border-dashed flex items-center justify-center relative overflow-hidden group ${getSeverityColor(
                              severity,
                              status,
                            )}`}
                          >
                            {isSuccess && (
                              <div
                                className="absolute inset-0 pointer-events-none opacity-5 group-hover:opacity-[8%] transition-opacity"
                                style={{
                                  backgroundImage: `repeating-linear-gradient(0deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.3) 1px, transparent 1px, transparent 4px)`,
                                }}
                              />
                            )}
                            {isFailed && (
                              <div
                                className="absolute inset-0 pointer-events-none opacity-5 group-hover:opacity-[8%] transition-opacity"
                                style={{
                                  backgroundImage: `repeating-linear-gradient(0deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.3) 1px, transparent 1px, transparent 4px)`,
                                }}
                              />
                            )}
                            <div className="relative z-10">
                              {getEventIcon(event.type, severity, status)}
                            </div>
                          </div>
                          <div>
                            <div className="text-white font-light">
                              {event.display?.message || event.type}
                            </div>
                            <CopyableId id={event.id} />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-mono text-gray-400 uppercase">
                          {event.type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-px h-5 rounded-none ${
                              status === "success" ? "bg-green-400" : "bg-red-400"
                            }`}
                          />
                          <span className="text-xs font-mono uppercase text-gray-400">
                            {status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {event.userId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/users/${event.userId}`);
                            }}
                            className="underline underline-offset-4 decoration-dashed hover:underline font-mono text-xs cursor-pointer transition-colors"
                          >
                            {event.userId.slice(0, 8)}...
                          </button>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-400">
                        <div className="flex font-mono uppercase flex-col">
                          {new Date(event.timestamp).toLocaleString()}
                          <p className="text-xs">
                            {new Date(event.timestamp).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white rounded-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewModal(event);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Event Modal */}
      {showViewModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg text-white font-light font-mono">
                  <span className="uppercase">Event Details</span>
                  <CopyableId id={selectedEvent.id} variant="subscript" nonSliced />
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-none border border-dashed flex items-center justify-center relative overflow-hidden ${getSeverityColor(
                    selectedEvent.display?.severity,
                    selectedEvent.status,
                  )}`}
                >
                  {selectedEvent.status === "success" &&
                    selectedEvent.display?.severity !== "failed" && (
                      <div
                        className="absolute inset-0 pointer-events-none opacity-[8%]"
                        style={{
                          backgroundImage: `repeating-linear-gradient(0deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.3) 1px, transparent 1px, transparent 4px)`,
                        }}
                      />
                    )}
                  {(selectedEvent.status === "failed" ||
                    selectedEvent.display?.severity === "failed") && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-[8%]"
                      style={{
                        backgroundImage: `repeating-linear-gradient(0deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.3) 1px, transparent 1px, transparent 4px)`,
                      }}
                    />
                  )}
                  <div className="relative z-10">
                    {getEventIcon(
                      selectedEvent.type,
                      selectedEvent.display?.severity,
                      selectedEvent.status,
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight">
                    {selectedEvent.display?.message || selectedEvent.type}
                  </div>
                  <div className="text-sm text-gray-400 font-mono uppercase">
                    {selectedEvent.type}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  {
                    label: "Status",
                    value: (selectedEvent.status || "success").toUpperCase(),
                  },
                  {
                    label: "Severity",
                    value: (selectedEvent.display?.severity || "info").toUpperCase(),
                  },
                  {
                    label: "Timestamp",
                    value: formatDateTime(selectedEvent.timestamp),
                  },
                  {
                    label: "Source",
                    value: (selectedEvent.source || "app").toUpperCase(),
                  },
                  selectedEvent.userId && {
                    label: "User ID",
                    value: selectedEvent.userId,
                  },
                  selectedEvent.sessionId && {
                    label: "Session ID",
                    value: selectedEvent.sessionId,
                  },
                  selectedEvent.organizationId && {
                    label: "Organization ID",
                    value: selectedEvent.organizationId,
                  },
                  selectedEvent.ipAddress && {
                    label: "IP Address",
                    value: selectedEvent.ipAddress,
                  },
                  selectedEvent.userAgent && {
                    label: "User Agent",
                    value: selectedEvent.userAgent,
                  },
                ]
                  .filter((item): item is { label: string; value: string } => Boolean(item))
                  .map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between border border-dashed border-white/15 bg-black/90 px-3 py-2 rounded-none"
                    >
                      <div className="text-[11px] font-mono font-light uppercase tracking-wide text-gray-400">
                        {item.label}
                      </div>
                      <div className="text-[10px] font-mono uppercase text-white text-right break-words max-w-[60%]">
                        {item.value}
                      </div>
                    </div>
                  ))}
                {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                  <div className="mt-4">
                    <div className="text-[11px] font-mono font-light uppercase tracking-wide text-gray-400 mb-2">
                      Metadata
                    </div>
                    <div className="border border-dashed border-white/15 bg-black/90 px-3 py-2 rounded-none">
                      <pre className="text-[10px] font-mono text-white overflow-x-auto">
                        {JSON.stringify(selectedEvent.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button
                onClick={() => setShowViewModal(false)}
                className="border border-white/20 bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .new-event-row {
          animation: slideInFromTop 0.5s ease-out;
        }

        .activity-details-scroll {
          scrollbar-width: none;
        }
        .activity-details-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
