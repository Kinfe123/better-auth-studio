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
}

export function LiveEventMarquee({ maxEvents = 50, pollInterval = 2000 }: LiveEventMarqueeProps) {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);
  const retryDelayRef = useRef(2000);
  const positionRef = useRef(0);
  const singleSetWidthRef = useRef(0);
  const isAnimatingRef = useRef(false);

  const pollEvents = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const params = new URLSearchParams({
        limit: '10',
        sort: 'desc',
      });

      if (lastEventId) {
        params.append('after', lastEventId);
      }

      // Use the API utility to get the correct path
      const apiPath = buildApiUrl('/api/events');

      const response = await fetch(`${apiPath}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Set connected to true on successful response (even if no events)
      setIsConnected(true);
      retryDelayRef.current = 2000; // Reset retry delay on success

      // Process events if they exist
      if (data.events && Array.isArray(data.events)) {
        const newEvents = data.events.filter(
          (event: AuthEvent) => !lastEventId || event.id !== lastEventId
        );

        if (newEvents.length > 0) {
          setEvents((prev) => {
            // Merge and deduplicate
            const existingIds = new Set(prev.map((e) => e.id));
            const uniqueNew = newEvents.filter((e: AuthEvent) => !existingIds.has(e.id));
            const updated = [...uniqueNew, ...prev].slice(0, maxEvents);
            return updated;
          });

          setLastEventId(newEvents[0].id);
        }
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
  }, [lastEventId, maxEvents]);

  useEffect(() => {
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
  }, [pollEvents, pollInterval]);

  // Exponential backoff on errors
  useEffect(() => {
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
  }, [isConnected, pollEvents, pollInterval]);

  // Smooth continuous scroll animation - runs independently of events updates
  useEffect(() => {
    const container = containerRef.current;
    if (!container || events.length === 0) {
      // Stop animation if no events
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        isAnimatingRef.current = false;
        positionRef.current = 0;
      }
      return;
    }

    // Initialize or update animation
    if (!isAnimatingRef.current) {
      // Start animation for the first time
      isAnimatingRef.current = true;
      positionRef.current = 0;
      singleSetWidthRef.current = container.scrollWidth / 3;
    } else {
      // Animation already running - just update the width reference
      // Use requestAnimationFrame to ensure DOM has updated
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

    const speed = 0.5;

    const animate = () => {
      if (!container || !isAnimatingRef.current) return;

      // Update position
      positionRef.current -= speed;

      // Get current width (may have been updated by the effect above)
      const currentSingleSetWidth = singleSetWidthRef.current || container.scrollWidth / 3;

      // Reset position seamlessly when we've scrolled one full set width
      if (Math.abs(positionRef.current) >= currentSingleSetWidth) {
        positionRef.current = 0;
      }

      // Apply transform using translate3d for better performance
      container.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      // Don't cancel animation on events change - only on unmount
    };
  }, [events.length]); // Only depend on length, not the events array itself

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        isAnimatingRef.current = false;
      }
    };
  }, []);

  const getSeverityColor = (severity?: string, status?: 'success' | 'failed') => {
    // If status is 'failed', always show red
    if (status === 'failed' || severity === 'failed') {
      return 'text-red-400';
    }

    switch (severity) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-amber-300'; // Softer yellowish color for info events
      default:
        return 'text-amber-300'; // Default to info color (yellowish) instead of white
    }
  };

  return (
    <div className="relative w-full h-10 overflow-hidden bg-black/50 border-y border-white/10">
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
          {events.length === 0 ? (
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
                    className={`text-xs font-mono ${getSeverityColor(event.display?.severity, event.status)}`}
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
