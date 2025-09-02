import { useState, useEffect, useRef, useCallback } from "react";
import { devLog } from "@/lib/devLog";
import { useWebSocket, WebSocketMessage } from "./useWebSocket";

export interface JobLog {
  task_id: number;
  task_number: number;
  task_opx_cost: number;
  execution_timestamp: string;
  execution_tx_hash: string;
  task_performer_id: number;
  task_attester_ids: number[] | null;
  is_successful: boolean;
  task_status: string;
  tx_url: string;
}

interface TaskUpdateData {
  task_id: number;
  job_id: string;
  user_id: string;
  changes: Partial<JobLog>;
  timestamp: string;
}

export function useJobLogsWebSocket(jobId: string | number | undefined) {
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const logsRef = useRef<JobLog[]>([]);
  const initialLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Build WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

    if (!API_BASE_URL || !API_KEY) {
      throw new Error("API base URL or API key not configured");
    }

    // Convert HTTP URL to WebSocket URL
    const wsUrl = API_BASE_URL.replace(/^https?:\/\//, "ws://");
    return `${wsUrl}/api/ws/tasks?api_key=${API_KEY}`;
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    devLog("Job logs WebSocket message received:", message);

    switch (message.type) {
      case "TASK_CREATED":
      case "TASK_UPDATED":
      case "TASK_STATUS_CHANGED":
      case "TASK_FEE_UPDATED":
        handleTaskUpdate(message.data as TaskUpdateData);
        break;

      case "ERROR":
        setError(message.data?.message || "WebSocket error occurred");
        break;

      default:
        devLog("Unknown WebSocket message type:", message.type);
    }
  }, []);

  // Handle WebSocket errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWebSocketError = useCallback((error: any) => {
    devLog("Job logs WebSocket error:", error);
    setError(`WebSocket connection error: ${error.message}`);
  }, []);

  // Handle WebSocket connection
  const handleWebSocketConnect = useCallback(() => {
    devLog("Job logs WebSocket connected");
    setError(null);

    // Set a timeout for initial load - if no data received within 10 seconds, show error
    initialLoadTimeoutRef.current = setTimeout(() => {
      if (!initialLoadComplete) {
        setError("No real-time data received. Please check your connection.");
        setLoading(false);
      }
    }, 10000);
  }, [initialLoadComplete]);

  // Handle WebSocket disconnection
  const handleWebSocketDisconnect = useCallback(() => {
    devLog("Job logs WebSocket disconnected");
    if (initialLoadTimeoutRef.current) {
      clearTimeout(initialLoadTimeoutRef.current);
      initialLoadTimeoutRef.current = null;
    }
  }, []);

  // Initialize WebSocket connection
  const {
    isConnected,
    isConnecting,
    error: wsError,
    subscribe,
    unsubscribe,
  } = useWebSocket(getWebSocketUrl(), {
    onMessage: handleWebSocketMessage,
    onError: handleWebSocketError,
    onConnect: handleWebSocketConnect,
    onDisconnect: handleWebSocketDisconnect,
    autoReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  });

  // Handle task updates from WebSocket
  const handleTaskUpdate = useCallback(
    (data: TaskUpdateData) => {
      if (!data.changes || !data.task_id) return;

      setLogs((prevLogs) => {
        const existingLogIndex = prevLogs.findIndex(
          (log) => log.task_id === data.task_id,
        );

        if (existingLogIndex >= 0) {
          // Update existing log
          const updatedLogs = [...prevLogs];
          updatedLogs[existingLogIndex] = {
            ...updatedLogs[existingLogIndex],
            ...data.changes,
          };
          return updatedLogs;
        } else {
          // Add new log if it has required fields
          const newLog = data.changes as JobLog;
          if (newLog.task_id && newLog.task_number !== undefined) {
            return [...prevLogs, newLog];
          }
          return prevLogs;
        }
      });

      // Mark initial load as complete when we receive first data
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
        setLoading(false);
        if (initialLoadTimeoutRef.current) {
          clearTimeout(initialLoadTimeoutRef.current);
          initialLoadTimeoutRef.current = null;
        }
      }
    },
    [initialLoadComplete],
  );

  // Subscribe to job room when connected and jobId is available
  useEffect(() => {
    if (isConnected && jobId) {
      const roomName = `job:${jobId}`;
      devLog("Subscribing to job room:", roomName);
      subscribe(roomName, { job_id: jobId.toString() });

      return () => {
        devLog("Unsubscribing from job room:", roomName);
        unsubscribe(roomName);
      };
    }
  }, [isConnected, jobId, subscribe, unsubscribe]);

  // Initialize loading state when jobId changes
  useEffect(() => {
    if (jobId) {
      setLoading(true);
      setError(null);
      setInitialLoadComplete(false);
      setLogs([]);
      logsRef.current = [];

      // Clear any existing timeout
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
        initialLoadTimeoutRef.current = null;
      }
    }
  }, [jobId]);

  // Update ref when logs change
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  // Handle WebSocket connection errors
  useEffect(() => {
    if (wsError) {
      setError(`WebSocket error: ${wsError.message}`);
      setLoading(false);
    }
  }, [wsError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
      }
    };
  }, []);

  return {
    logs,
    loading: loading || isConnecting,
    error: error || (wsError ? wsError.message : null),
    isConnected,
    isConnecting,
  };
}
