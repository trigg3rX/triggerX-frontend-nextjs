import { devLog } from "@/lib/devLog";
import { useState, useEffect } from "react";

export interface JobLog {
  id: string;
  message: string;
  timestamp: string;
  success: boolean;
  tgUsed: number;
  txHash: string;
}

export function useJobLogs(jobId: string | number | undefined) {
  const [logs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    devLog("useJobLogs effect running, jobId:", jobId);
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
        const response = await fetch(`${API_BASE_URL}/tasks/job/${jobId}`, {
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

        devLog("Get Job Logs", data);

        setLoading(false);
      } catch {
        setError("Something went wrong fetching job logs.");
        setLoading(false);
      }
    };
    fetchLogs();
  }, [jobId]);

  return { logs, loading, error };
}
