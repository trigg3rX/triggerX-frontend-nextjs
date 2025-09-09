import { useState, useEffect, useRef, useCallback } from "react";
import { devLog } from "@/lib/devLog";

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: string;
}

export interface WebSocketError {
  code: string;
  message: string;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: WebSocketError | null;
}

export interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: WebSocketError) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(autoReconnect);

  /**
   * Open a WebSocket connection if not already open.
   * Handles setting state, wiring event listeners, and scheduling reconnects.
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      devLog("Attempting to connect to WebSocket URL:", url);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        devLog("WebSocket connected to:", url);
        setState({
          isConnected: true,
          isConnecting: false,
          error: null,
        });
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        devLog("Raw WebSocket data received:", event.data);
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          devLog("Parsed WebSocket message:", message);
          devLog("Message type:", message.type);
          devLog("Message data:", message.data);
          onMessage?.(message);
        } catch (error) {
          devLog("Failed to parse WebSocket message:", error);
          devLog("Raw data that failed to parse:", event.data);
        }
      };

      ws.onerror = (event) => {
        const error: WebSocketError = {
          code: "WEBSOCKET_ERROR",
          message: `WebSocket connection error`,
        };
        devLog("WebSocket error:", error);
        devLog("WebSocket error event:", event);
        setState((prev) => ({ ...prev, error }));
        onError?.(error);
      };

      ws.onclose = (event) => {
        devLog("WebSocket disconnected:", event.code, event.reason);
        devLog("WebSocket close event details:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          url: url,
        });
        setState({
          isConnected: false,
          isConnecting: false,
          error: null,
        });
        onDisconnect?.();

        // Attempt to reconnect if auto-reconnect is enabled
        if (
          shouldReconnectRef.current &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          devLog(
            `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      const wsError: WebSocketError = {
        code: "CONNECTION_FAILED",
        message: "Failed to create WebSocket connection",
      };
      setState({
        isConnected: false,
        isConnecting: false,
        error: wsError,
      });
      onError?.(wsError);
    }
  }, [
    url,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnectInterval,
    maxReconnectAttempts,
  ]);

  /**
   * Cleanly close the WebSocket connection and cancel any pending reconnect.
   * Disables further auto-reconnect attempts for this hook instance.
   */
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User requested close"); // 1000 = Normal Closure
      wsRef.current = null;
    }

    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  /**
   * Send a message over the active WebSocket connection.
   * If the socket is not open, the message is not sent.
   *
   * @param message Message object or string to be serialized and sent
   */
  const send = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageStr =
        typeof message === "string" ? message : JSON.stringify(message);
      wsRef.current.send(messageStr);
      devLog("WebSocket message sent:", message);
    } else {
      devLog("WebSocket is not connected, cannot send message");
    }
  }, []);

  /**
   * Convenience helper to publish a SUBSCRIBE message for a logical room/topic.
   * Additional data can be included and will be spread into the payload.
   *
   * @param room Logical topic identifier to subscribe to
   * @param data Optional payload to include with the subscription
   */
  const subscribe = useCallback(
    (room: string, data?: Record<string, unknown>) => {
      send({
        type: "SUBSCRIBE",
        data: {
          room,
          ...data,
        },
      });
    },
    [send],
  );

  /**
   * Convenience helper to publish an UNSUBSCRIBE message for a logical room/topic.
   *
   * @param room Logical topic identifier to unsubscribe from
   */
  const unsubscribe = useCallback(
    (room: string) => {
      send({
        type: "UNSUBSCRIBE",
        data: {
          room,
        },
      });
    },
    [send],
  );

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    send,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
  };
}
