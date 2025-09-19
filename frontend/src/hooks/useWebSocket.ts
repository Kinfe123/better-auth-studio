import { useEffect, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  message: string;
}

export function useWebSocket(onMessage: (message: WebSocketMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        console.log('🔌 Attempting to connect to WebSocket:', wsUrl);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          reconnectAttempts.current = 0;
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);
            onMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);

          // If connection was refused (code 1006) or server unavailable (code 1001),
          // it means WebSocket server is not running (normal mode)
          if (event.code === 1006 || event.code === 1001) {
            console.log('ℹ️  WebSocket server not available (running in normal mode)');
            return;
          }

          // Only attempt to reconnect if we haven't exceeded max attempts
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
            console.log(
              `🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.log('❌ Max reconnection attempts reached');
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
        };
      } catch (error) {
        console.error('❌ Failed to connect WebSocket:', error);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [onMessage]);
}
