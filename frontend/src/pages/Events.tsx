import { format } from 'date-fns';
import { AlertCircle, Computer, Eye, Filter, Loader, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CodeBlock } from '../components/CodeBlock';
import { CopyableId } from '../components/CopyableId';
import {
  AlertInfo,
  AlertTriangle,
  Building2,
  Check,
  ErrorInfo,
  Info,
  Users,
} from '../components/PixelIcons';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { buildApiUrl } from '../utils/api';

interface AuthEvent {
  id: string;
  type: string;
  timestamp: string | Date;
  status?: 'success' | 'failed';
  userId?: string;
  sessionId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  source?: 'app' | 'api';
  display?: {
    message: string;
    severity?: 'info' | 'success' | 'warning' | 'failed';
  };
}

const formatDateTime = (value?: string | Date) => {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';

  const month = format(d, 'MMM').toUpperCase();
  const day = format(d, 'dd');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const milliseconds = String(d.getMilliseconds()).padStart(2, '0').slice(0, 2);

  return `${month} ${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const getSeverityColor = (severity?: string, status?: string) => {
  if (status === 'failed') {
    return 'text-red-400/70 border-white/15 bg-white/5';
  }
  switch (severity) {
    case 'success':
      return 'text-green-400/70 border-white/15 bg-white/5';
    case 'warning':
      return 'text-yellow-400/70 border-white/15 bg-white/5';
    case 'failed':
      return 'text-red-400/70 border-white/15 bg-white/5';
    default:
      return 'text-blue-400/70 border-white/15 bg-white/5';
  }
};

const getEventIcon = (eventType: string, severity?: string, status?: string) => {
  if (
    eventType.includes('organization') ||
    eventType.includes('member') ||
    eventType.includes('team') ||
    eventType.includes('invitation')
  ) {
    return <Building2 className="w-4 h-4" />;
  }

  if (eventType.includes('user')) {
    return <Users className="w-4 h-4" />;
  }

  if (eventType.includes('session') || eventType.includes('login')) {
    return <Computer className="w-4 h-4" />;
  }

  if (status === 'failed' || severity === 'failed') {
    return <AlertTriangle className="w-4 h-4" />;
  }
  switch (severity) {
    case 'success':
      return <Check className="w-4 h-4" />;
    case 'warning':
      return <AlertInfo className="w-4 h-4" />;
    case 'failed':
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
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

  const eventStats = useMemo(() => {
    const success = events.filter(
      (e) => e.status === 'success' && e.display?.severity !== 'failed'
    ).length;
    const failed = events.filter(
      (e) => e.status === 'failed' || e.display?.severity === 'failed'
    ).length;
    const warning = events.filter((e) => e.display?.severity === 'warning').length;
    const info = events.filter(
      (e) => e.display?.severity === 'info' || !e.display?.severity
    ).length;
    return { success, failed, warning, info };
  }, [events]);

  const fetchEvents = useCallback(async (isInitial = false) => {
    if (isPollingRef.current && !isInitial) return;
    isPollingRef.current = true;

    try {
      const params = new URLSearchParams({
        limit: '50',
        sort: 'desc',
      });

      const apiPath = buildApiUrl('/api/events');
      const response = await fetch(`${apiPath}?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 500) {
          try {
            const errorData = await response.json();
            if (
              errorData.details?.includes('not found in schema') ||
              errorData.details?.includes('Model')
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
      console.error('Failed to fetch events:', error);
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
        const response = await fetch(buildApiUrl('/api/events/status'));
        const data = await response.json();
        setEventsEnabled(data?.enabled === true);
      } catch (error) {
        console.error('Failed to check events status:', error);
        setEventsEnabled(false);
      } finally {
        setCheckingEvents(false);
      }
    };

    checkConfig();
  }, []);

  useEffect(() => {
    if (showViewModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
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

  const openViewModal = (event: AuthEvent) => {
    setSelectedEvent(event);
    setShowViewModal(true);
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.display?.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'success' && event.status === 'success') ||
      (filter === 'failed' && event.status === 'failed') ||
      (filter === 'info' && event.display?.severity === 'info') ||
      (filter === 'warning' && event.display?.severity === 'warning');

    return matchesSearch && matchesFilter;
  });

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
              <AlertCircle className="w-8 h-8 text-yellow-400" />
              <div className="text-center">
                <h2 className="text-xl text-white font-light mb-2">Event Ingestion Not Enabled</h2>
                <p className="text-gray-400 text-sm font-mono">
                  {!isSelfHosted
                    ? 'Event ingestion is only available in self-hosted mode.'
                    : 'Please enable event ingestion in your studio configuration to view events.'}
                </p>
              </div>
            </div>

            {isSelfHosted && (
              <div className="w-full max-w-4xl">
                <div className="mb-4">
                  <p className="text-gray-300 text-sm font-mono mb-2">
                    Add the following configuration to your{' '}
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
    <div className="space-y-6 p-6">
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

        <div className="flex w-[180px] items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={filter} className="w-full" onValueChange={setFilter}>
            <SelectTrigger className="w-full font-mono uppercase text-[11px] border border-dashed border-white/20 bg-black/30 text-white rounded-none">
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
                  Timestamp
                </th>
                <th className="text-right py-4 px-4 text-white font-mono uppercase text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No events found
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const isNew = newEventIds.has(event.id);
                  const severity = event.display?.severity || 'info';
                  const status = event.status || 'success';
                  const isSuccess = status === 'success' && severity !== 'failed';
                  const isFailed = status === 'failed' || severity === 'failed';

                  return (
                    <tr
                      key={event.id}
                      onClick={() => openViewModal(event)}
                      className={`border-b border-dashed border-white/5 hover:bg-white/5 transition-all cursor-pointer ${isNew ? (isSuccess ? 'new-event-row bg-green-400/10 border-green-400/20' : isFailed ? 'new-event-row bg-red-400/10 border-red-400/20' : '') : ''}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-none border border-dashed flex items-center justify-center relative overflow-hidden group ${getSeverityColor(
                              severity,
                              status
                            )}`}
                          >
                            {/* Horizontal pattern overlay for success - only on icon, show on hover */}
                            {isSuccess && (
                              <div
                                className="absolute inset-0 pointer-events-none opacity-5 group-hover:opacity-[8%] transition-opacity"
                                style={{
                                  backgroundImage: `repeating-linear-gradient(0deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.3) 1px, transparent 1px, transparent 4px)`,
                                }}
                              />
                            )}
                            {/* Horizontal pattern overlay for failed - only on icon, show on hover */}
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
                              status === 'success' ? 'bg-green-400' : 'bg-red-400'
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
                            className="underline underline-offset-4 decoration-dashed hover:underline font-mono text-xs transition-colors"
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
                            {new Date(event.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
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
                    selectedEvent.status
                  )}`}
                >
                  {selectedEvent.status === 'success' &&
                    selectedEvent.display?.severity !== 'failed' && (
                      <div
                        className="absolute inset-0 pointer-events-none opacity-[8%]"
                        style={{
                          backgroundImage: `repeating-linear-gradient(0deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.3) 1px, transparent 1px, transparent 4px)`,
                        }}
                      />
                    )}
                  {(selectedEvent.status === 'failed' ||
                    selectedEvent.display?.severity === 'failed') && (
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
                      selectedEvent.status
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
                    label: 'Status',
                    value: (selectedEvent.status || 'success').toUpperCase(),
                  },
                  {
                    label: 'Severity',
                    value: (selectedEvent.display?.severity || 'info').toUpperCase(),
                  },
                  {
                    label: 'Timestamp',
                    value: formatDateTime(selectedEvent.timestamp),
                  },
                  {
                    label: 'Source',
                    value: (selectedEvent.source || 'app').toUpperCase(),
                  },
                  selectedEvent.userId && {
                    label: 'User ID',
                    value: selectedEvent.userId,
                  },
                  selectedEvent.sessionId && {
                    label: 'Session ID',
                    value: selectedEvent.sessionId,
                  },
                  selectedEvent.organizationId && {
                    label: 'Organization ID',
                    value: selectedEvent.organizationId,
                  },
                  selectedEvent.ipAddress && {
                    label: 'IP Address',
                    value: selectedEvent.ipAddress,
                  },
                  selectedEvent.userAgent && {
                    label: 'User Agent',
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
      `}</style>
    </div>
  );
}
