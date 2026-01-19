'use client';

import { useEffect, useRef, useState } from 'react';

interface FakeEvent {
  id: string;
  timestamp: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'failed';
}

const fakeEvents: FakeEvent[] = [
  { id: '1', timestamp: '10:23:45', message: 'John Doe logged in', severity: 'success' },
  { id: '2', timestamp: '10:24:12', message: 'New Org "Acme Corp" created', severity: 'info' },
  { id: '3', timestamp: '10:24:38', message: 'Team member invited to "Engineering"', severity: 'info' },
  { id: '4', timestamp: '10:25:01', message: 'Failed login attempt for user@example.com', severity: 'failed' },
  { id: '5', timestamp: '10:25:27', message: 'Sarah Smith signed up', severity: 'success' },
  { id: '6', timestamp: '10:25:53', message: 'Password reset requested', severity: 'warning' },
  { id: '7', timestamp: '10:26:19', message: 'Org "Tech Startup" updated', severity: 'info' },
  { id: '8', timestamp: '10:26:45', message: 'Mike Johnson logged out', severity: 'info' },
  { id: '9', timestamp: '10:27:11', message: 'Member removed from "Design Team"', severity: 'warning' },
  { id: '10', timestamp: '10:27:37', message: 'Email verification sent', severity: 'info' },
  { id: '11', timestamp: '10:28:03', message: 'OAuth login via GitHub', severity: 'success' },
  { id: '12', timestamp: '10:28:29', message: 'Session expired for user@test.com', severity: 'warning' },
];

interface EventMarqueeProps {
  speed?: number;
  pauseOnHover?: boolean;
}

export function EventMarquee({ speed = 0.5, pauseOnHover = true }: EventMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const singleSetWidthRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const isPausedRef = useRef(false);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'success':
        return 'text-white';
      case 'info':
        return 'text-white';
      case 'warning':
        return 'text-white';
      case 'failed':
        return 'text-white';
      default:
        return 'text-white';
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      positionRef.current = 0;
      singleSetWidthRef.current = container.scrollWidth / 3;
    }

    const animate = () => {
      if (!container || !isAnimatingRef.current || isPausedRef.current) {
        if (isAnimatingRef.current && !isPausedRef.current) {
          animationRef.current = requestAnimationFrame(animate);
        }
        return;
      }

      positionRef.current -= speed;
      const currentSingleSetWidth = singleSetWidthRef.current || container.scrollWidth / 3;

      if (Math.abs(positionRef.current) >= currentSingleSetWidth) {
        positionRef.current = 0;
      }

      container.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        isAnimatingRef.current = false;
      }
    };
  }, [speed]);

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      isPausedRef.current = true;
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      isPausedRef.current = false;
      if (isAnimatingRef.current && containerRef.current) {
        const animate = () => {
          if (!containerRef.current || !isAnimatingRef.current || isPausedRef.current) {
            if (isAnimatingRef.current && !isPausedRef.current) {
              animationRef.current = requestAnimationFrame(animate);
            }
            return;
          }
          positionRef.current -= speed;
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
      className="relative w-full h-10 overflow-hidden bg-black/50 border-t border-white/15"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center h-full overflow-hidden">
        <div
          ref={containerRef}
          className="flex items-center gap-8 whitespace-nowrap"
          style={{
            willChange: 'transform',
            transform: 'translate3d(0px, 0, 0)',
          }}
        >
          {[...fakeEvents, ...fakeEvents, ...fakeEvents].map((event, index) => {
            const setIndex = Math.floor(index / fakeEvents.length);
            const eventIndex = index % fakeEvents.length;
            return (
              <div
                key={`set-${setIndex}-event-${event.id}-${eventIndex}`}
                className="flex items-center gap-2 flex-shrink-0"
              >
                <span className="text-xs font-mono text-white/30">{event.timestamp}</span>
                <span className={`text-xs font-mono ${getSeverityColor(event.severity)}`}>
                  {event.message}
                </span>
                <span className="text-white/20">•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

