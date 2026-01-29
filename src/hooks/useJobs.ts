import { devLog } from "@/lib/devLog";
import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { transformJobsResponse, JobsApiResponse } from "@/utils/jobsMapper";

export type JobType = {
  id: number;
  jobTitle: string;
  taskDefinitionId: string;
  raw_task_definition_id: string; // Raw numeric task definition ID for conditional logic
  is_active: boolean;
  job_cost_actual: string;
  timeFrame: string;
  argType: string;
  timeInterval: string;
  targetContractAddress: string;
  createdAt: string;
  targetFunction: string;
  targetChainId: string;
  created_chain_id: string; // <-- add this
  linkedJobs?: JobType[];
  type: string;
  condition_type?: string;
  upper_limit?: number;
  lower_limit?: number;
  value_source_url?: string;
  next_execution_timestamp?: string;
};

export function useJobs() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    const fetchJobs = async () => {
      if (!address || typeof chainId === "undefined" || chainId === null) {
        setJobs([]);
        return;
      }
      setLoading(true);

      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!API_BASE_URL) {
          setError("API base URL not set. Please contact support.");
          setLoading(false);
          return;
        }

        const apiUrl = `${API_BASE_URL}/api/jobs/user/${address}/chain/${chainId}`;
        devLog("[useJobs] Fetching jobs for chain:", chainId);
        const headers = {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        };
        const response = await fetch(apiUrl, {
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 404) {
            if (!isActive) return;
            setJobs([]);
            setError(null); // treat as empty, not error
            setLoading(false);
            return;
          }
          if (!isActive) return;
          setError(`Failed to fetch jobs. (${response.status})`);
          setLoading(false);
          return;
        }
        const jobsData: JobsApiResponse = await response.json();

        // Use shared transformation logic
        const sortedJobs = transformJobsResponse(
          jobsData,
          chainId,
          "[useJobs]",
        );

        if (!isActive) return;
        setJobs(sortedJobs);
        setError(null);
      } catch (err: unknown) {
        if (!isActive) return;
        if (
          typeof err === "object" &&
          err !== null &&
          (err as { name?: string }).name === "AbortError"
        ) {
          return;
        }
        setError(err instanceof Error ? "" : "Something went wrong.");
      } finally {
        if (!isActive) return;
        setLoading(false);
        devLog("[useJobs] Loading finished.");
      }
    };
    fetchJobs();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [address, chainId]);

  return { jobs, loading, error };
}
