import { useCallback, useEffect, useRef, useState } from "react";
import { buildApiUrl } from "../utils/api";

interface AuthEvent {
  id: string;
  type: string;
  timestamp: string;
  status?: "success" | "failed";
  display?: {
    message: string;
    severity?: "info" | "success" | "warning" | "failed";
  };
  metadata?: Record<string, any>;
}

interface LiveEventMarqueeProps {
  maxEvents?: number;
  pollInterval?: number;
  speed?: number;
  pauseOnHover?: boolean;
  limit?: number;
  sort?: "asc" | "desc"; // Sort order for events: 'desc' = newest first, 'asc' = oldest first
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

function parseTimeWindow(timeWindow?: { since?: string; custom?: number }): Date | null {
  if (!timeWindow) {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return oneHourAgo;
  }

  if (timeWindow.since !== undefined) {
    return parseTimeWindowString(timeWindow.since);
  } else if (timeWindow.custom !== undefined) {
    const now = new Date();
    now.setSeconds(now.getSeconds() - timeWindow.custom);
    return now;
  } else {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return oneHourAgo;
  }
}

function parseTimeWindowString(timeWindow: string): Date | null {
  const match = timeWindow.match(/^(\d+)([hmsd])$/i);
  if (!match) {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return oneHourAgo;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const now = new Date();

  switch (unit) {
    case "m": // minutes
      now.setMinutes(now.getMinutes() - value);
      break;
    case "h": // hours
      now.setHours(now.getHours() - value);
      break;
    case "d": // days
      now.setDate(now.getDate() - value);
      break;
    case "s": // seconds
      now.setSeconds(now.getSeconds() - value);
      break;
    default:
      // Default to 1 hour
      now.setHours(now.getHours() - 1);
  }

  return now;
}

function checkIsSelfHosted(): boolean {
  const cfg = getStudioConfig();
  return !!cfg.basePath;
}

function isEventModelLookupError(value: unknown): boolean {
  const text =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? JSON.stringify(value)
        : String(value ?? "");

  return (
    text.includes("not found in schema") ||
    text.includes("not found in model") ||
    text.includes("Model") ||
    text.includes("auth_event") ||
    text.includes("auth_events")
  );
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const singleSetRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);
  const retryDelayRef = useRef(2000);
  const positionRef = useRef(0);
  const singleSetWidthRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const isPausedRef = useRef(false);
  const [repeatCount, setRepeatCount] = useState(3);

  useEffect(() => {
    const checkEventsStatus = async () => {
      if (!checkIsSelfHosted()) {
        setEventsEnabled(false);
        return;
      }

      try {
        const response = await fetch(buildApiUrl("/api/events/status"));
        const data = await response.json();
        setEventsEnabled(data?.enabled === true);
      } catch (error) {
        console.error("Failed to check events status:", error);
        setEventsEnabled(false);
      }
    };

    checkEventsStatus();
  }, []);

  const pollEvents = useCallback(async (): Promise<boolean> => {
    // Don't poll if events are not enabled
    if (eventsEnabled !== true) {
      return false;
    }

    if (isPollingRef.current) return false;
    isPollingRef.current = true;

    try {
      // Use sort from props, default to 'desc' (newest first)
      const sortOrder = propSort ?? "desc";

      const config = getStudioConfig();
      const timeWindow = config.liveMarquee?.timeWindow || "1h";
      const since = parseTimeWindow(timeWindow);

      const params = new URLSearchParams({
        limit: "10",
        sort: sortOrder, // Use configurable sort order
      });

      if (since) {
        params.append("since", since.toISOString());
      }

      // Don't use 'after' cursor for polling - we want the latest events
      // and will filter duplicates ourselves

      const apiPath = buildApiUrl("/api/events");

      const response = await fetch(`${apiPath}?${params.toString()}`);

      if (!response.ok) {
        // Handle 500 errors gracefully
        if (response.status === 500) {
          try {
            const errorData = await response.json();
            if (
              isEventModelLookupError(errorData?.details) ||
              isEventModelLookupError(errorData?.error) ||
              isEventModelLookupError(errorData)
            ) {
              setIsConnected(true);
              return true;
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
          // If this is the first fetch and we have events, set them directly
          if (prev.length === 0 && data.events.length > 0) {
            const initialEvents = data.events.slice(0, maxEvents);
            if (initialEvents.length > 0) {
              setLastEventId(initialEvents[0].id);
            }
            return initialEvents;
          }

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
        console.warn("Events API response missing events array:", data);
      }
      return true;
    } catch (error) {
      console.error("Failed to poll events:", error);
      if (isEventModelLookupError(error)) {
        setIsConnected(true);
        return true;
      }
      setIsConnected(false);
      return false;
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
        pollEvents().then((connected) => {
          if (connected) {
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

  const updateTrackMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const singleSet = singleSetRef.current;

    if (!viewport || !track || !singleSet || events.length === 0) {
      return;
    }

    const singleSetWidth = singleSet.getBoundingClientRect().width;
    if (!singleSetWidth || !Number.isFinite(singleSetWidth)) {
      return;
    }

    singleSetWidthRef.current = singleSetWidth;
    const normalizedOffset = Math.abs(positionRef.current) % singleSetWidth;
    positionRef.current = normalizedOffset === 0 ? 0 : -normalizedOffset;
    track.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;

    // Keep enough repeated sets rendered so the viewport stays fully covered
    // while we animate through one full set before wrapping.
    const nextRepeatCount = Math.max(3, Math.ceil(viewport.clientWidth / singleSetWidth) + 2);
    setRepeatCount((current) => (current === nextRepeatCount ? current : nextRepeatCount));
  }, [events]);

  useEffect(() => {
    if (events.length === 0) {
      setRepeatCount(3);
      singleSetWidthRef.current = 0;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        isAnimatingRef.current = false;
        positionRef.current = 0;
      }
      if (trackRef.current) {
        trackRef.current.style.transform = "translate3d(0px, 0, 0)";
      }
      return;
    }

    updateTrackMetrics();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateTrackMetrics);
      return () => {
        window.removeEventListener("resize", updateTrackMetrics);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updateTrackMetrics();
    });

    if (viewportRef.current) {
      resizeObserver.observe(viewportRef.current);
    }
    if (singleSetRef.current) {
      resizeObserver.observe(singleSetRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [events, updateTrackMetrics, repeatCount]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || events.length === 0) {
      return;
    }

    isAnimatingRef.current = true;

    const animate = () => {
      if (!isAnimatingRef.current) {
        return;
      }

      if (!isPausedRef.current) {
        const currentSpeed = speedRef.current;
        const validSpeed =
          typeof currentSpeed === "number" &&
          !isNaN(currentSpeed) &&
          isFinite(currentSpeed) &&
          currentSpeed > 0
            ? currentSpeed
            : 0.5;

        positionRef.current -= validSpeed;

        const currentSingleSetWidth = singleSetWidthRef.current;
        if (currentSingleSetWidth > 0 && Math.abs(positionRef.current) >= currentSingleSetWidth) {
          positionRef.current = positionRef.current + currentSingleSetWidth;
        }

        track.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      isAnimatingRef.current = false;
    };
  }, [events, repeatCount]);

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
    const colors = propColors || {};

    const defaults = {
      success: "text-emerald-700 dark:text-emerald-400",
      info: "text-sky-700 dark:text-sky-300",
      warning: "text-amber-700 dark:text-amber-300",
      error: "text-red-700 dark:text-red-400",
      failed: "text-red-700 dark:text-red-400",
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
    status?: "success" | "failed",
  ): { className?: string; style?: React.CSSProperties } => {
    const colors = getEventColors();
    let colorValue: string;

    if (status === "failed" || severity === "failed") {
      colorValue = colors.failed;
    } else {
      switch (severity) {
        case "success":
          colorValue = colors.success;
          break;
        case "error":
          colorValue = colors.error;
          break;
        case "warning":
          colorValue = colors.warning;
          break;
        case "info":
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
    }
  };

  return (
    <div
      className="relative h-10 w-full overflow-hidden border-y border-border bg-background/80 backdrop-blur-sm"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute -top-1 right-4 z-10 flex items-center gap-1 py-1">
        <div
          className={`h-1 w-1 rounded-none ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
        />
        <span className="text-[9px] font-mono animate-pulse text-muted-foreground">
          {isConnected ? "LIVE" : "CONNECTING..."}
        </span>
      </div>

      <div ref={viewportRef} className="flex items-center h-full overflow-hidden">
        <div
          ref={trackRef}
          className="flex items-center whitespace-nowrap"
          style={{
            willChange: "transform",
            transform: "translate3d(0px, 0, 0)", // Initial transform to prevent layout shift, use translate3d for GPU acceleration
          }}
        >
          {eventsEnabled === false ? (
            <span className="ml-5 text-xs font-mono text-muted-foreground">Events not enabled</span>
          ) : events.length === 0 ? (
            <span className="ml-5 animate-pulse text-xs font-mono text-muted-foreground">
              Waiting for events...
            </span>
          ) : (
            Array.from({ length: repeatCount }, (_, setIndex) => (
              <div
                key={`event-set-${setIndex}`}
                ref={setIndex === 0 ? singleSetRef : undefined}
                aria-hidden={setIndex > 0}
                className="flex items-center gap-8 flex-shrink-0 pr-8"
              >
                {events.map((event, eventIndex) => (
                  <div
                    key={`set-${setIndex}-event-${event.id}-${eventIndex}`}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    <span className="text-xs font-mono text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`text-xs font-mono ${getSeverityColor(event.display?.severity, event.status).className || ""}`}
                      style={getSeverityColor(event.display?.severity, event.status).style}
                    >
                      {event.display?.message || event.type}
                    </span>
                    <span className="text-border">•</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
