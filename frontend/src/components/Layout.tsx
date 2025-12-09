import {
  Building2,
  Database,
  LayoutDashboard,
  Mail,
  RefreshCw,
  Search,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCounts } from '../contexts/CountsContext';
import { useWebSocket } from '../hooks/useWebSocket';
import CommandPalette from './CommandPalette';

interface LayoutProps {
  children: ReactNode;
}

type WatchIndicatorStatus =
  | 'connecting'
  | 'watching'
  | 'refreshing'
  | 'up_to_date'
  | 'error'
  | 'unavailable'
  | 'reconnecting';

interface WatchIndicatorState {
  status: WatchIndicatorStatus;
  fileName?: string;
  updatedAt?: number;
}

const watchStatusMeta: Record<
  WatchIndicatorStatus,
  { label: string; textClass: string; dotClass: string; animate?: string }
> = {
  connecting: {
    label: 'Connecting',
    textClass: 'text-amber-200 border-amber-400/40',
    dotClass: 'bg-amber-300',
    animate: 'animate-pulse',
  },
  watching: {
    label: 'Watching',
    textClass: 'text-emerald-200 border-emerald-400/40',
    dotClass: 'bg-emerald-300',
  },
  refreshing: {
    label: 'Refreshing',
    textClass: 'text-amber-200 border-amber-400/40',
    dotClass: 'bg-amber-300',
    animate: 'animate-pulse',
  },
  up_to_date: {
    label: 'Up-to-date',
    textClass: 'text-emerald-200 border-emerald-400/40',
    dotClass: 'bg-emerald-300',
  },
  error: {
    label: 'Reload Failed',
    textClass: 'text-red-200 border-red-500/50',
    dotClass: 'bg-red-400',
    animate: 'animate-pulse',
  },
  unavailable: {
    label: 'Watch Off',
    textClass: 'text-gray-300 border-gray-500/40',
    dotClass: 'bg-gray-400',
  },
  reconnecting: {
    label: 'Reconnecting',
    textClass: 'text-amber-200 border-amber-400/40',
    dotClass: 'bg-amber-300',
    animate: 'animate-pulse',
  },
};

function normalizeStudioStatus(status?: string): WatchIndicatorStatus {
  switch (status) {
    case 'refreshing':
      return 'refreshing';
    case 'error':
      return 'error';
    case 'up_to_date':
    case 'watching':
      return 'up_to_date';
    default:
      return 'watching';
  }
}

const EMAIL_TEMPLATES_COUNT = 6;
const TOOLS_COUNT = 14;

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { counts, loading } = useCounts();
  const navigate = useNavigate();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [studioVersion, setStudioVersion] = useState('v1.0.0');
  const [watchState, setWatchState] = useState<WatchIndicatorState>({
    status: 'connecting',
  });
  const [schemaCount, setSchemaCount] = useState<number | null>(null);
  const pendingRefreshRef = useRef(false);
  const refreshRecoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHardRefreshRef = useRef(false);

  const clearRecoveryTimeout = () => {
    if (refreshRecoveryTimeoutRef.current) {
      clearTimeout(refreshRecoveryTimeoutRef.current);
      refreshRecoveryTimeoutRef.current = null;
    }
  };

  const scheduleRecoveryTimeout = () => {
    clearRecoveryTimeout();
    refreshRecoveryTimeoutRef.current = setTimeout(() => {
      pendingRefreshRef.current = false;
      setWatchState((prev) => ({
        ...prev,
        status: 'up_to_date',
        updatedAt: Date.now(),
      }));
    }, 4000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        if (data.studio?.version) {
          setStudioVersion(`v${data.studio.version}`);
        }
      } catch (_error) {}
    };

    const fetchSchemaCount = async () => {
      try {
        const response = await fetch('/api/database/schema');
        const data = await response.json();
        if (data.success && data.schema && data.schema.tables) {
          setSchemaCount(data.schema.tables.length);
        }
      } catch (_error) {
        setSchemaCount(null);
      }
    };

    fetchVersion();
    fetchSchemaCount();

    return () => {
      clearRecoveryTimeout();
    };
  }, []);

  const handleHardRefresh = () => {
    pendingRefreshRef.current = false;
    pendingHardRefreshRef.current = false;
    clearRecoveryTimeout();
    setWatchState((prev) => ({
      ...prev,
      status: 'refreshing',
      updatedAt: Date.now(),
    }));
    window.location.reload();
  };

  useWebSocket(
    (message) => {
      if (message.type === 'studio_status') {
        const nextStatus = normalizeStudioStatus(message.status);
        if (nextStatus === 'up_to_date') {
          pendingRefreshRef.current = false;
          clearRecoveryTimeout();
        }
        setWatchState((prev) => ({
          status: nextStatus,
          fileName: message.fileName || prev.fileName,
          updatedAt: message.updatedAt || Date.now(),
        }));
        return;
      }

      if (message.type === 'config_change_detected') {
        pendingRefreshRef.current = true;
        scheduleRecoveryTimeout();
        setWatchState((prev) => ({
          ...prev,
          status: 'refreshing',
          fileName: message.fileName || prev.fileName,
          updatedAt: Date.now(),
        }));
        if (!pendingHardRefreshRef.current) {
          pendingHardRefreshRef.current = true;
          setTimeout(() => {
            handleHardRefresh();
          }, 200);
        }
        return;
      }

      if (message.type === 'config_changed') {
        pendingRefreshRef.current = false;
        clearRecoveryTimeout();
        setWatchState((prev) => ({
          ...prev,
          status: 'up_to_date',
          fileName: message.fileName || prev.fileName,
          updatedAt: message.changedAt || Date.now(),
        }));
        return;
      }

      if (message.type === 'connected') {
        pendingRefreshRef.current = false;
        clearRecoveryTimeout();
        setWatchState((prev) => ({
          ...prev,
          status: 'up_to_date',
          updatedAt: Date.now(),
        }));
      }
    },
    {
      onStatusChange: (status) => {
        setWatchState((prev) => {
          if (prev.status === 'refreshing' && status !== 'unavailable' && status !== 'open') {
            return prev;
          }

          switch (status) {
            case 'connecting':
              return { ...prev, status: 'connecting' };
            case 'open':
              clearRecoveryTimeout();
              return pendingRefreshRef.current
                ? prev
                : { ...prev, status: 'watching', updatedAt: Date.now() };
            case 'reconnecting':
            case 'closed':
              return { ...prev, status: 'reconnecting' };
            case 'error':
              return { ...prev, status: 'error' };
            case 'unavailable':
              pendingRefreshRef.current = false;
              clearRecoveryTimeout();
              return { ...prev, status: 'unavailable' };
            default:
              return prev;
          }
        });
      },
    }
  );

  const statusMeta = watchStatusMeta[watchState.status];

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return count.toString();
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      badge: loading ? '...' : formatCount(counts.users),
    },
    {
      name: 'Organizations',
      href: '/organizations',
      icon: Building2,
      badge: loading ? '...' : formatCount(counts.organizations),
    },
    {
      name: 'Database',
      href: '/database',
      icon: Database,
      badge: schemaCount !== null ? formatCount(schemaCount) : undefined,
    },
    {
      name: 'Emails',
      href: '/emails',
      icon: Mail,
      badge: formatCount(EMAIL_TEMPLATES_COUNT),
    },
    {
      name: 'Tools',
      href: '/tools',
      icon: Wrench,
      badge: formatCount(TOOLS_COUNT),
    },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-black/70 border-b border-white/15">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-end justify-end space-x-2">
              <div className="w-7 h-7 border border-dashed border-white/20 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-md">⚡</span>
              </div>
              <div className="mb-0 cursor-pointer" onClick={() => navigate('/')}>
                <h1 className="text-md inline-flex mb-0 items-start font-light font-mono uppercase text-white gap-2">
                  Better-Auth Studio
                  <sup className="text-xs text-gray-400 ml-1 mt-0 flex items-center space-x-2">
                    <span className="inline-flex items-center">
                      <span className="mr-1">[</span>
                      <span className="text-white/80 lowercase font-mono text-xs">
                        {studioVersion}
                      </span>
                      <span className="ml-1">]</span>
                    </span>
                    <span
                      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-normal uppercase tracking-wide text-[9px] ${statusMeta.textClass} ${statusMeta.animate ?? ''}`}
                    >
                      <span
                        className={`mr-1 h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`}
                      ></span>
                      {statusMeta.label}
                    </span>
                    <button
                      type="button"
                      onClick={handleHardRefresh}
                      aria-label="Hard refresh studio"
                      className="ml-1 inline-flex items-center rounded border border-dashed border-white/20 p-0.5 text-white/70 transition hover:text-white hover:border-white/50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </sup>
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                onClick={() => setIsCommandPaletteOpen(true)}
                className="pl-10 pr-4 py-2  bg-black border rounded-none border-gray-600 text-white border-dashed border-white/20 focus:ring-2 focus:ring-white focus:border-transparent transition-colors placeholder-gray-400 cursor-pointer"
                readOnly
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 border border-dashed border-white/10 rounded-sm px-1.5 py-0.5">
                ⌘ K
              </kbd>
            </div>
            <a
              href="https://better-auth-studio.vercel.app/docs"
              target="_blank"
              rel="noopener"
              className="group flex items-center"
            >
              <span className="text-white/70 text-xs mr-2 transition-colors duration-150 group-hover:text-white group-hover:bg-gray-500/20 rounded px-0.5">
                [
              </span>
              <span className="text-white/80 font-mono text-sm uppercase">Docs</span>
              <span className="text-white/70 text-xs ml-2 transition-colors duration-150 group-hover:text-white group-hover:bg-gray-500/20 rounded px-0.5">
                ]
              </span>
            </a>
            <a
              href="https://better-auth.com/docs"
              target="_blank"
              rel="noopener"
              className="group flex items-center"
            >
              <span className="text-white/70 text-xs mr-2 transition-colors duration-150 group-hover:text-white group-hover:bg-gray-500/20 rounded px-0.5">
                [
              </span>
              <span className="text-white/80 font-mono text-sm uppercase">Support</span>
              <span className="text-white/70 text-xs ml-2 transition-colors duration-150 group-hover:text-white group-hover:bg-gray-500/20 rounded px-0.5">
                ]
              </span>
            </a>
          </div>
        </div>
      </div>
      <div className="bg-black/50 border-b border-white/15">
        <div className="px-6">
          <nav className="flex overflow-y-hidden overflow-x-auto">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <div key={item.name} className="flex items-center">
                 {index === 0 && (
                    <div className="h-[50px] -my-5 w-px bg-transparent border-dashed border-r border-white/20" />
                 )} 
                  <Link
                    to={item.href}
                    className={`flex items-center space-x-2 border-x-0 px-8 py-4 text-sm font-medium border-b-2 transition-all duration-200 relative ${
                      isActive
                        ? 'border-white text-white'
                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500/50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="inline-flex font-mono uppercase border-x-0 font-light text-xs items-start">
                      {item.name}
                      {item.badge && (
                        <sup className="text-xs text-gray-500 ml-1">
                          <span className="mr-0.5">[</span>
                          <span className="text-white/80 lowercase font-mono text-xs">
                            {item.badge}
                          </span>
                          <span className="ml-0.5">]</span>
                        </sup>
                      )}
                    </span>
                  </Link>
                  {index <= navigation.length - 1 && (
                    <div className="h-[50px] -my-5 w-px bg-transparent border-dashed border-r border-white/20" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 p-0">{children}</div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
