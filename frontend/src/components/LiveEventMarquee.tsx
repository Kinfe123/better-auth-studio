import { useCallback, useEffect, useRef, useState } from 'react';
import { buildApiUrl } from '../utils/api';

interface AuthEvent {
  id: string;
  type: string;
  timestamp: string;
  status?: 'success' | 'failed';
  display?: {
    message: string;
    severity?: 'info' | 'success' | 'warning' | 'failed';
  };
  metadata?: Record<string, any>;
}

interface LiveEventMarqueeProps {
  maxEvents?: number;
  pollInterval?: number;
  speed?: number;
  pauseOnHover?: boolean;
  limit?: number;
  sort?: 'asc' | 'desc'; // Sort order for events: 'desc' = newest first, 'asc' = oldest first
  colors?: {
    success?: string;
    info?: string;
    warning?: string;
    error?: string;
    failed?: string;
  };
}

function getStudioConfig() {
  return (window as any).__STUDIO_CONFIG__ || {};
}

function checkIsSelfHosted(): boolean {
  const cfg = getStudioConfig();
  return !!cfg.basePath;
}

export function LiveEventMarquee({
  maxEvents: propMaxEvents,
  pollInterval = 2000,
  speed: propSpeed,
  pauseOnHover: propPauseOnHover,
  colors: propColors,
  sort: propSort,
}: LiveEventMarqueeProps) {
  const maxEvents = propMaxEvents ?? 50;
  const speedRef = useRef(propSpeed ?? 0.5);

  useEffect(() => {
    if (propSpeed !== undefined) {
      speedRef.current = propSpeed;
    }
  }, [propSpeed]);

  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [_, setLastEventId] = useState<string | null>(null);
  const [eventsEnabled, setEventsEnabled] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);
  const retryDelayRef = useRef(2000);
  const positionRef = useRef(0);
  const singleSetWidthRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const checkEventsStatus = async () => {
      if (!checkIsSelfHosted()) {
        setEventsEnabled(false);
        return;
      }

      try {
        const response = await fetch(buildApiUrl('/api/events/status'));
        const data = await response.json();
        setEventsEnabled(data?.enabled === true);
      } catch (error) {
        console.error('Failed to check events status:', error);
        setEventsEnabled(false);
      }
    };

    checkEventsStatus();
  }, []);

  const pollEvents = useCallback(async () => {
    // Don't poll if events are not enabled
    if (eventsEnabled !== true) {
      return;
    }

    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      // Use sort from props, default to 'desc' (newest first)
      const sortOrder = propSort ?? 'desc';

      const params = new URLSearchParams({
        limit: '10',
        sort: sortOrder, // Use configurable sort order
      });

      // Don't use 'after' cursor for polling - we want the latest events
      // and will filter duplicates ourselves

      const apiPath = buildApiUrl('/api/events');

      const response = await fetch(`${apiPath}?${params.toString()}`);

      if (!response.ok) {
        // Handle 500 errors gracefully
        if (response.status === 500) {
          try {
            const errorData = await response.json();
            if (
              errorData.details?.includes('not found in schema') ||
              errorData.details?.includes('Model')
            ) {
              setIsConnected(true);
              return;
            }
          } catch {
            // Continue with error
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setIsConnected(true);
      retryDelayRef.current = 2000;

      if (data.events && Array.isArray(data.events)) {
        setEvents((prev) => {
          // Merge and deduplicate - only add events we don't already have
          const existingIds = new Set(prev.map((e) => e.id));
          const uniqueNew = data.events.filter((e: AuthEvent) => !existingIds.has(e.id));

          if (uniqueNew.length > 0) {
            // Add new events to the front, keep max events
            const updated = [...uniqueNew, ...prev].slice(0, maxEvents);
            // Update last event ID to the newest one
            if (updated.length > 0) {
              setLastEventId(updated[0].id);
            }
            return updated;
          }

          // No new events, return previous state
          return prev;
        });
      } else if (!data.events) {
        // If response doesn't have events array, log for debugging
        console.warn('Events API response missing events array:', data);
      }
    } catch (error) {
      console.error('Failed to poll events:', error);
      setIsConnected(false);
    } finally {
      isPollingRef.current = false;
    }
  }, [maxEvents, propSort, eventsEnabled]);

  useEffect(() => {
    // Don't start polling if events are not enabled
    if (eventsEnabled !== true) {
      return;
    }

    // Initial poll
    pollEvents();

    // Set up polling interval
    const startPolling = () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }

      pollTimeoutRef.current = setInterval(() => {
        pollEvents();
      }, pollInterval);
    };

    startPolling();

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
    };
  }, [pollEvents, pollInterval, eventsEnabled]);

  // Exponential backoff on errors
  useEffect(() => {
    // Don't retry if events are not enabled
    if (eventsEnabled !== true) {
      return;
    }

    if (!isConnected) {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }

      const retryPoll = () => {
        pollEvents().then(() => {
          if (isConnected) {
            // Success, resume normal polling
            pollTimeoutRef.current = setInterval(pollEvents, pollInterval);
          } else {
            // Still failed, increase delay
            retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30000);
            setTimeout(retryPoll, retryDelayRef.current);
          }
        });
      };

      setTimeout(retryPoll, retryDelayRef.current);
    }
  }, [isConnected, pollEvents, pollInterval, eventsEnabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || events.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        isAnimatingRef.current = false;
        positionRef.current = 0;
      }
      return;
    }

    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      positionRef.current = 0;
      singleSetWidthRef.current = container.scrollWidth / 3;
    } else {
      requestAnimationFrame(() => {
        if (container) {
          const newWidth = container.scrollWidth / 3;
          // Adjust position proportionally if width changed to prevent jumps
          if (singleSetWidthRef.current > 0 && newWidth !== singleSetWidthRef.current) {
            const ratio = newWidth / singleSetWidthRef.current;
            positionRef.current = positionRef.current * ratio;
          }
          singleSetWidthRef.current = newWidth;
        }
      });
      return; // Don't restart animation
    }

    const animate = () => {
      if (!container || !isAnimatingRef.current || isPausedRef.current) {
        // If paused, still request next frame but don't update position
        if (isAnimatingRef.current && !isPausedRef.current) {
          animationRef.current = requestAnimationFrame(animate);
        }
        return;
      }

      const currentSpeed = speedRef.current;

      const validSpeed =
        typeof currentSpeed === 'number' &&
        !isNaN(currentSpeed) &&
        isFinite(currentSpeed) &&
        currentSpeed > 0
          ? currentSpeed
          : 0.5;

      positionRef.current -= validSpeed;

      const currentSingleSetWidth = singleSetWidthRef.current || container.scrollWidth / 3;

      if (Math.abs(positionRef.current) >= currentSingleSetWidth) {
        positionRef.current = 0;
      }

      container.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {};
  }, [events.length]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        isAnimatingRef.current = false;
      }
    };
  }, []);

  const isHexColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  const getEventColors = () => {
    // Use colors from props if provided
    const colors = propColors || {};

    const defaults = {
      success: 'text-green-400', // #34d399
      info: 'text-amber-300', // #fcd34d
      warning: 'text-yellow-400', // #facc15
      error: 'text-red-400', // #f87171
      failed: 'text-red-400', // #f87171
    };

    return {
      success: colors.success || defaults.success,
      info: colors.info || defaults.info,
      warning: colors.warning || defaults.warning,
      error: colors.error || defaults.error,
      failed: colors.failed || defaults.failed,
    };
  };

  const getSeverityColor = (
    severity?: string,
    status?: 'success' | 'failed'
  ): { className?: string; style?: React.CSSProperties } => {
    const colors = getEventColors();
    let colorValue: string;

    if (status === 'failed' || severity === 'failed') {
      colorValue = colors.failed;
    } else {
      switch (severity) {
        case 'success':
          colorValue = colors.success;
          break;
        case 'error':
          colorValue = colors.error;
          break;
        case 'warning':
          colorValue = colors.warning;
          break;
        case 'info':
          colorValue = colors.info;
          break;
        default:
          colorValue = colors.info;
      }
    }

    if (isHexColor(colorValue)) {
      return { style: { color: colorValue } };
    } else {
      return { className: colorValue };
    }
  };

  // Get pauseOnHover from props, default to true
  const pauseOnHover = propPauseOnHover ?? true;

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      isPausedRef.current = true;
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      isPausedRef.current = false;
      // Resume animation if it was running
      if (isAnimatingRef.current && containerRef.current) {
        const animate = () => {
          if (!containerRef.current || !isAnimatingRef.current || isPausedRef.current) {
            if (isAnimatingRef.current && !isPausedRef.current) {
              animationRef.current = requestAnimationFrame(animate);
            }
            return;
          }

          // Get current speed from ref (updated reactively)
          const currentSpeed = speedRef.current;
          // Ensure speed is a valid positive number
          const validSpeed =
            typeof currentSpeed === 'number' &&
            !isNaN(currentSpeed) &&
            isFinite(currentSpeed) &&
            currentSpeed > 0
              ? currentSpeed
              : 0.5;
          positionRef.current -= validSpeed;

          const currentSingleSetWidth =
            singleSetWidthRef.current || containerRef.current.scrollWidth / 3;
          if (Math.abs(positionRef.current) >= currentSingleSetWidth) {
            positionRef.current = 0;
          }

          containerRef.current.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
          animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
      }
    }
  };

  return (
    <div
      className="relative w-full h-10 overflow-hidden bg-black/50 border-y border-white/10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute -top-1 right-4 z-10 flex items-center gap-1 py-1">
        <div
          className={`w-1 h-1 rounded-full ${
            isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`}
        />
        <span className="text-[9px] animate-pulse font-mono text-white/50">
          {isConnected ? 'LIVE' : 'CONNECTING...'}
        </span>
      </div>

      <div className="flex items-center h-full overflow-hidden">
        <div
          ref={containerRef}
          className="flex items-center gap-8 whitespace-nowrap"
          style={{
            willChange: 'transform',
            transform: 'translate3d(0px, 0, 0)', // Initial transform to prevent layout shift, use translate3d for GPU acceleration
          }}
        >
          {eventsEnabled === false ? (
            <span className="text-xs ml-5 font-mono text-white/50">Events not enabled</span>
          ) : events.length === 0 ? (
            <span className="text-xs ml-5 font-mono text-white/50">Waiting for events...</span>
          ) : (
            [...events, ...events, ...events].map((event, index) => {
              const setIndex = Math.floor(index / events.length);
              const eventIndex = index % events.length;
              return (
                <div
                  key={`set-${setIndex}-event-${event.id}-${eventIndex}`}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <span className="text-xs font-mono text-white/30">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`text-xs font-mono ${getSeverityColor(event.display?.severity, event.status).className || ''}`}
                    style={getSeverityColor(event.display?.severity, event.status).style}
                  >
                    {event.display?.message || event.type}
                  </span>
                  <span className="text-white/20">•</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
