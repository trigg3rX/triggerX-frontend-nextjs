import { devLog } from "@/lib/devLog";
import { useState, useEffect } from "react";
import { useChainId } from "wagmi";
import { transformJobsResponse, JobsApiResponse } from "@/utils/jobsMapper";
import { JobType } from "@/hooks/useJobs";

export function useSafeJobs(safeAddress: string | null) {
  const chainId = useChainId();
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const fetchSafeJobs = async () => {
      // Early return if no safe address or chainId
      if (!safeAddress || typeof chainId === "undefined" || chainId === null) {
        setJobs([]);
        setLoading(false);
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

        // Convert safe address to lowercase as per requirement
        const apiUrl = `${API_BASE_URL}/api/jobs/safe-address/${safeAddress.toLowerCase()}`;
        devLog("[useSafeJobs] Fetching jobs from:", apiUrl, "chain:", chainId);

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
          setError(`Failed to fetch safe jobs. (${response.status})`);
          setLoading(false);
          return;
        }

        const jobsData: JobsApiResponse = await response.json();

        // Use shared transformation logic, filtering to current chain
        const sortedJobs = transformJobsResponse(
          jobsData,
          chainId,
          "[useSafeJobs]",
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
        devLog("[useSafeJobs] Loading finished.");
      }
    };

    fetchSafeJobs();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [safeAddress, chainId]);

  return { jobs, loading, error };
}
