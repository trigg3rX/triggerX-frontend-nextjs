import { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket, WebSocketMessage } from "./useWebSocket";

export interface JobLog {
  task_id: number;
  task_number: number;
  task_opx_cost: number;
  execution_timestamp: string;
  execution_tx_hash: string;
  task_performer_id: number;
  task_attester_ids: number[] | null;
  is_accepted: boolean;
  task_status: string;
  tx_url: string;
  converted_arguments?: string; // For task_definition_id 2, 4, 6
}

interface TaskUpdateData {
  task_id: number;
  job_id: string;
  user_id: string;
  changes: Partial<JobLog> & {
    created_at?: string;
    task_definition_id?: number;
    is_imua?: boolean;
  };
  timestamp: string;
}

// WebSocket message data structure
interface WebSocketTaskData {
  task_id: number;
  job_id: string;
  user_id: string;
  changes: {
    task_id: number;
    job_id: string;
    task_definition_id?: number;
    is_imua?: boolean;
    created_at?: string;
    task_number?: number;
    task_opx_cost?: number;
    execution_timestamp?: string;
    execution_tx_hash?: string;
    task_performer_id?: number;
    task_attester_ids?: number[] | null;
    is_accepted?: boolean;
    task_status?: string;
    tx_url?: string;
    converted_arguments?: string; // For task_definition_id 2, 4, 6
  };
  timestamp: string;
}

export function useJobLogsHybrid(
  jobId: string | number | undefined,
  autoConnect: boolean = true,
) {
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useWebSocketMode, setUseWebSocketMode] = useState(autoConnect);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const logsRef = useRef<JobLog[]>([]);
  const initialLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Build WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

    if (!API_BASE_URL) {
      throw new Error(
        "API base URL not configured. Please set NEXT_PUBLIC_API_BASE_URL in your environment variables.",
      );
    }

    // Convert HTTP URL to WebSocket URL and append the correct endpoint
    const wsUrl = API_BASE_URL.replace(/^http/, "ws") + "/api/ws/tasks";

    // Append API key as query parameter
    const separator = wsUrl.includes("?") ? "&" : "?";
    return `${wsUrl}${separator}api_key=${API_KEY}`;
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case "TASK_CREATED":
      case "TASK_UPDATED":
      case "TASK_STATUS_CHANGED":
      case "TASK_FEE_UPDATED":
        // Handle the WebSocket message format
        const wsData = message.data as WebSocketTaskData;

        if (wsData && wsData.changes) {
          // Transform WebSocket data to TaskUpdateData format
          const taskUpdateData: TaskUpdateData = {
            task_id: wsData.task_id,
            job_id: wsData.job_id,
            user_id: wsData.user_id,
            changes: wsData.changes,
            timestamp: wsData.timestamp,
          };
          handleTaskUpdate(taskUpdateData);
        } else if (message.data && typeof message.data === "object") {
          // Fallback: try to handle direct data format
          const directData = message.data as Record<string, unknown>;
          if (directData.task_id && typeof directData.task_id === "number") {
            const taskUpdateData: TaskUpdateData = {
              task_id: directData.task_id as number,
              job_id: (directData.job_id as string) || "",
              user_id: (directData.user_id as string) || "",
              changes:
                (directData.changes as Partial<JobLog>) ||
                (directData as Partial<JobLog>),
              timestamp:
                (directData.timestamp as string) || new Date().toISOString(),
            };
            handleTaskUpdate(taskUpdateData);
          }
        }
        break;

      case "ERROR":
        // Cast message.data to a type that includes an optional 'message' property
        setError("WebSocket error occurred");
        break;

      case "JOB_TASKS_SNAPSHOT":
        // Handle initial job tasks snapshot
        if (message.data && typeof message.data === "object") {
          const snapshotData = message.data as {
            job_id: string;
            tasks: Array<{
              task_id?: number;
              id?: number;
              task_number?: number;
              task_opx_cost?: number;
              opx_cost?: number;
              execution_timestamp?: string;
              timestamp?: string;
              execution_tx_hash?: string;
              tx_hash?: string;
              task_performer_id?: number;
              performer_id?: number;
              task_attester_ids?: number[] | null;
              attester_ids?: number[] | null;
              is_accepted?: boolean;
              success?: boolean;
              task_status?: string;
              status?: string;
              tx_url?: string;
              transaction_url?: string;
              converted_arguments?: string; // For task_definition_id 2, 4, 6
            }>;
          };

          if (snapshotData.tasks && Array.isArray(snapshotData.tasks)) {
            // Transform snapshot tasks to JobLog format
            const snapshotLogs: JobLog[] = snapshotData.tasks.map((task) => ({
              task_id: task.task_id || task.id || 0,
              task_number: task.task_number || task.id || 0,
              task_opx_cost: task.task_opx_cost || task.opx_cost || 0,
              execution_timestamp:
                task.execution_timestamp || task.timestamp || "",
              execution_tx_hash: task.execution_tx_hash || task.tx_hash || "",
              task_performer_id:
                task.task_performer_id || task.performer_id || 0,
              task_attester_ids:
                task.task_attester_ids || task.attester_ids || null,
              is_accepted: task.is_accepted || false,
              task_status: task.task_status || task.status || "processing",
              tx_url: task.tx_url || task.transaction_url || "",
              converted_arguments: task.converted_arguments,
            }));

            // Sort by execution_timestamp descending (recent tasks first)
            const sorted = [...snapshotLogs].sort((a, b) => {
              const tA = new Date(a.execution_timestamp || 0).getTime();
              const tB = new Date(b.execution_timestamp || 0).getTime();
              if (tB !== tA) return tB - tA;
              return (
                (b.task_number ?? b.task_id) - (a.task_number ?? a.task_id)
              );
            });
            setLogs(sorted);
            setInitialLoadComplete(true);
            setLoading(false);
          }
        }
        break;

      default:
      // devLog("Unknown WebSocket message type:", message.type); // Removed devLog
    }
  }, []);

  // Handle WebSocket errors
  const handleWebSocketError = useCallback(
    (error: { code: string; message: string }) => {
      setError(` ${error.message}`);
    },
    [],
  );

  // Handle WebSocket connection
  const handleWebSocketConnect = useCallback(() => {
    setError(null);
    setUseWebSocketMode(true);
  }, []);

  // Handle WebSocket disconnection
  const handleWebSocketDisconnect = useCallback(() => {
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
    maxReconnectAttempts: 3, // Reduced for faster fallback
  });

  // Handle task updates from WebSocket
  const handleTaskUpdate = useCallback(
    (data: TaskUpdateData) => {
      if (!data.changes || !data.task_id) {
        return;
      }

      setLogs((prevLogs) => {
        const existingLogIndex = prevLogs.findIndex(
          (log) => log.task_id === data.task_id,
        );

        let next: JobLog[];
        if (existingLogIndex >= 0) {
          const updatedLogs = [...prevLogs];
          updatedLogs[existingLogIndex] = {
            ...updatedLogs[existingLogIndex],
            ...data.changes,
          };
          next = updatedLogs;
        } else {
          const newLog: JobLog = {
            task_id: data.task_id,
            task_number: data.changes.task_number || data.task_id,
            task_opx_cost: data.changes.task_opx_cost || 0,
            execution_timestamp:
              data.changes.execution_timestamp || data.changes.created_at || "",
            execution_tx_hash: data.changes.execution_tx_hash || "",
            task_performer_id: data.changes.task_performer_id || 0,
            task_attester_ids: data.changes.task_attester_ids || null,
            is_accepted: data.changes.is_accepted || false,
            task_status: data.changes.task_status || "processing",
            tx_url: data.changes.tx_url || "",
            converted_arguments: data.changes.converted_arguments,
          };
          next = [...prevLogs, newLog];
        }
        // Keep order: newest first (by execution_timestamp, then task_number)
        return next.sort((a, b) => {
          const tA = new Date(a.execution_timestamp || 0).getTime();
          const tB = new Date(b.execution_timestamp || 0).getTime();
          if (tB !== tA) return tB - tA;
          return (b.task_number ?? b.task_id) - (a.task_number ?? a.task_id);
        });
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

  // Subscribe to job room when connected and jobId is available (WebSocket mode only)
  useEffect(() => {
    if (isConnected && jobId && useWebSocketMode) {
      const roomName = `job:${jobId}`;
      subscribe(roomName, { job_id: jobId.toString() });

      return () => {
        unsubscribe(roomName);
      };
    }
  }, [isConnected, jobId, useWebSocketMode, subscribe, unsubscribe]);

  // Initialize based on environment
  useEffect(() => {
    if (jobId) {
      setLoading(true);
      setError(null);
      setInitialLoadComplete(false);
      setLogs([]);
      logsRef.current = [];

      // Clear any existing timeouts
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
        initialLoadTimeoutRef.current = null;
      }
    }
  }, [jobId, autoConnect]);

  // Update ref when logs change
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  // Handle WebSocket connection errors
  useEffect(() => {
    if (wsError && useWebSocketMode) {
      setError(`WebSocket error: ${wsError.message}`);
    }
  }, [wsError, useWebSocketMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current as NodeJS.Timeout);
      }
    };
  }, []);

  // Debug logging for state changes
  useEffect(() => {}, [
    jobId,
    useWebSocketMode,
    isConnected,
    isConnecting,
    logs.length,
    error,
  ]);

  return {
    logs,
    loading: loading || isConnecting,
    error: error || (wsError ? wsError.message : null),
    isConnected,
    isConnecting,
    useWebSocketMode,
  };
}
