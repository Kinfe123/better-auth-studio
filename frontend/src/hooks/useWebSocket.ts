import { useEffect, useRef } from "react";

interface WebSocketMessage {
  type: string;
  message?: string;
  [key: string]: any;
}

type WebSocketConnectionStatus =
  | "connecting"
  | "open"
  | "closed"
  | "reconnecting"
  | "unavailable"
  | "error";

interface UseWebSocketOptions {
  onStatusChange?: (status: WebSocketConnectionStatus) => void;
  maxReconnectAttempts?: number;
}

export function useWebSocket(
  onMessage: (message: WebSocketMessage) => void,
  options?: UseWebSocketOptions,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const hasConnectedRef = useRef(false);
  const messageHandlerRef = useRef(onMessage);
  const statusChangeRef = useRef(options?.onStatusChange);
  const maxReconnectAttempts = options?.maxReconnectAttempts ?? 5;

  useEffect(() => {
    messageHandlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    statusChangeRef.current = options?.onStatusChange;
  }, [options?.onStatusChange]);

  useEffect(() => {
    let isUnmounted = false;

    const connect = () => {
      try {
        statusChangeRef.current?.("connecting");
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          reconnectAttempts.current = 0;
          hasConnectedRef.current = true;
          statusChangeRef.current?.("open");
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            if (messageHandlerRef.current) {
              messageHandlerRef.current(message);
            }
          } catch (_error) {}
        };

        wsRef.current.onclose = (event) => {
          if (isUnmounted) {
            return;
          }
          // If connection was refused (code 1006) or server unavailable (code 1001),
          // it means WebSocket server is not running (normal mode)
          if (!hasConnectedRef.current && (event.code === 1006 || event.code === 1001)) {
            statusChangeRef.current?.("unavailable");
            return;
          }

          statusChangeRef.current?.("closed");

          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);

            statusChangeRef.current?.("reconnecting");

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            statusChangeRef.current?.("unavailable");
          }
        };

        wsRef.current.onerror = (_error) => {
          statusChangeRef.current?.("error");
        };
      } catch (_error) {}
    };

    connect();

    return () => {
      isUnmounted = true;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [maxReconnectAttempts]);
}
