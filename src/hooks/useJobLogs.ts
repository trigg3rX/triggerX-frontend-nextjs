import { useState, useEffect } from "react";

interface ApiJobLog {
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

export function useJobLogs(jobId: string | number | undefined) {
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("useJobLogs effect running, jobId:", jobId);
    if (!jobId) return;
    setLoading(true);
    setError(null);
    const fetchLogs = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!API_BASE_URL) {
          setError("API base URL not set. Please contact support.");
          setLoading(false);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/tasks/job/${jobId}`, {
          headers: {
            "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
        });
        console.log("Raw response:", response);
        if (!response.ok) {
          setError(`Failed to fetch job logs.`);
          setLoading(false);
          return;
        }
        const data = await response.json();

        // Transform the API response to match our JobLog interface
        const formattedLogs = (data as ApiJobLog[]).map((log) => ({
          task_id: log.task_id,
          task_number: log.task_number,
          task_opx_cost: log.task_opx_cost,
          execution_timestamp: log.execution_timestamp,
          execution_tx_hash: log.execution_tx_hash,
          task_performer_id: log.task_performer_id,
          task_attester_ids: log.task_attester_ids,
          is_successful: log.is_successful,
          task_status: log.task_status,
          tx_url: log.tx_url,
        }));

        console.log("Get Job Logs", formattedLogs);
        setLogs(formattedLogs);

        setLoading(false);
      } catch {
        setError("No logs found.");
        setLoading(false);
      }
    };
    fetchLogs();
  }, [jobId]);

  return { logs, loading, error };
}
