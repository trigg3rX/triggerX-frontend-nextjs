import { devLog } from "@/lib/devLog";
import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";

export type JobType = {
  id: number;
  jobTitle: string;
  taskDefinitionId: string;
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
};

// Types for raw API data
interface RawJobData {
  job_data: {
    job_id: number;
    job_title: string;
    task_definition_id: string;
    job_cost_actual: string;
    time_frame?: string;
    chain_status: number;
    link_job_id: number;
    created_at: string;
    last_executed_at?: string;
    user_id?: string;
    priority?: string;
    security?: string;
    custom?: string;
    task_ids?: string[];
    fee_used?: string;
    status: string;
    created_chain_id?: string; // <-- add this
    is_active?: boolean;
  };
  time_job_data?: Record<string, unknown>;
  event_job_data?: Record<string, unknown>;
  condition_job_data?: Record<string, unknown>;
}

interface JobsApiResponse {
  jobs: RawJobData[];
}

const mapJobType = (taskDefinitionId: string) => {
  const typeId = String(taskDefinitionId);
  switch (typeId) {
    case "1":
    case "2":
      return "Time-based";
    case "3":
    case "4":
      return "Event-based";
    case "5":
    case "6":
      return "Condition-based";
    default:
      return "Unknown";
  }
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
        devLog("[useJobs] Fetching jobs from:", apiUrl, "chain:", chainId);
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
        devLog("[useJobs] Raw jobsData:", jobsData);

        // Build job map for linked jobs
        const jobMap: Record<number, RawJobData> = {};
        jobsData.jobs.forEach((job: RawJobData) => {
          jobMap[job.job_data.job_id] = job;
        });
        // Build linked jobs map
        const linkedJobsMap: Record<number, JobType[]> = {};
        jobsData.jobs.forEach((job: RawJobData) => {
          if (job.job_data.chain_status === 0) {
            const mainJobId = job.job_data.job_id;
            const linkedJobs: JobType[] = [];
            let nextJobId = job.job_data.link_job_id;
            while (nextJobId !== -1) {
              const nextJob = jobMap[nextJobId];
              if (!nextJob) break;
              const typeSpecificData =
                nextJob.time_job_data ||
                nextJob.event_job_data ||
                nextJob.condition_job_data ||
                {};
              const processedLinkedJob: JobType = {
                id: nextJob.job_data.job_id,
                jobTitle: nextJob.job_data.job_title,
                taskDefinitionId: mapJobType(
                  nextJob.job_data.task_definition_id,
                ),
                is_active: typeSpecificData.is_active === true,
                job_cost_actual: nextJob.job_data.job_cost_actual,
                timeFrame: nextJob.job_data.time_frame || "",
                argType:
                  typeof typeSpecificData.arg_type === "string"
                    ? typeSpecificData.arg_type
                    : String(typeSpecificData.arg_type ?? ""),
                timeInterval: ["Condition-based", "Event-based"].includes(
                  mapJobType(nextJob.job_data.task_definition_id),
                )
                  ? "0"
                  : typeof typeSpecificData.time_interval === "string"
                    ? typeSpecificData.time_interval
                    : String(typeSpecificData.time_interval ?? ""),
                targetContractAddress:
                  typeof typeSpecificData.target_contract_address === "string"
                    ? typeSpecificData.target_contract_address
                    : String(typeSpecificData.target_contract_address ?? ""),
                createdAt: nextJob.job_data.created_at,
                targetFunction:
                  typeof typeSpecificData.target_function === "string"
                    ? typeSpecificData.target_function
                    : String(typeSpecificData.target_function ?? ""),
                targetChainId:
                  typeof typeSpecificData.target_chain_id === "string"
                    ? typeSpecificData.target_chain_id
                    : String(typeSpecificData.target_chain_id ?? ""),
                created_chain_id:
                  typeof nextJob.job_data.created_chain_id !== "undefined"
                    ? String(nextJob.job_data.created_chain_id)
                    : typeof typeSpecificData.target_chain_id === "string"
                      ? typeSpecificData.target_chain_id
                      : String(typeSpecificData.target_chain_id ?? ""),
                linkedJobs: [],
                type: mapJobType(nextJob.job_data.task_definition_id),
                condition_type:
                  typeof typeSpecificData.condition_type === "string"
                    ? typeSpecificData.condition_type
                    : undefined,
                upper_limit:
                  typeof typeSpecificData.upper_limit === "number"
                    ? typeSpecificData.upper_limit
                    : typeof typeSpecificData.upper_limit === "string"
                      ? parseFloat(typeSpecificData.upper_limit)
                      : undefined,
                lower_limit:
                  typeof typeSpecificData.lower_limit === "number"
                    ? typeSpecificData.lower_limit
                    : typeof typeSpecificData.lower_limit === "string"
                      ? parseFloat(typeSpecificData.lower_limit)
                      : undefined,
                value_source_url:
                  typeof typeSpecificData.value_source_url === "string"
                    ? typeSpecificData.value_source_url
                    : undefined,
              };
              linkedJobs.push(processedLinkedJob);
              nextJobId = nextJob.job_data.link_job_id;
            }
            linkedJobsMap[mainJobId] = linkedJobs;
          }
        });
        devLog("[useJobs] linkedJobsMap:", linkedJobsMap);
        // Build main jobs array
        const tempJobs: JobType[] = jobsData.jobs
          .filter(
            (jobDetail: RawJobData) =>
              jobDetail.job_data.chain_status === 0 &&
              jobDetail.job_data.status !== "deleted",
          )
          .map((jobDetail: RawJobData) => {
            const typeSpecificData =
              jobDetail.time_job_data ||
              jobDetail.event_job_data ||
              jobDetail.condition_job_data ||
              {};
            return {
              id: jobDetail.job_data.job_id,
              jobTitle: jobDetail.job_data.job_title,
              taskDefinitionId: mapJobType(
                jobDetail.job_data.task_definition_id,
              ),
              is_active: typeSpecificData.is_active === true,
              linkedJobs: linkedJobsMap[jobDetail.job_data.job_id] || [],
              job_cost_actual: jobDetail.job_data.job_cost_actual,
              timeFrame: jobDetail.job_data.time_frame || "",
              argType:
                typeof typeSpecificData.arg_type === "string"
                  ? typeSpecificData.arg_type
                  : String(typeSpecificData.arg_type ?? ""),
              timeInterval: ["Condition-based", "Event-based"].includes(
                mapJobType(jobDetail.job_data.task_definition_id),
              )
                ? "0"
                : typeof typeSpecificData.time_interval === "string"
                  ? typeSpecificData.time_interval
                  : String(typeSpecificData.time_interval ?? ""),
              targetContractAddress:
                typeof typeSpecificData.target_contract_address === "string"
                  ? typeSpecificData.target_contract_address
                  : String(typeSpecificData.target_contract_address ?? ""),
              createdAt: jobDetail.job_data.created_at,
              targetFunction:
                typeof typeSpecificData.target_function === "string"
                  ? typeSpecificData.target_function
                  : String(typeSpecificData.target_function ?? ""),
              targetChainId:
                typeof typeSpecificData.target_chain_id === "string"
                  ? typeSpecificData.target_chain_id
                  : String(typeSpecificData.target_chain_id ?? ""),
              created_chain_id:
                typeof jobDetail.job_data.created_chain_id !== "undefined"
                  ? String(jobDetail.job_data.created_chain_id)
                  : typeof typeSpecificData.target_chain_id === "string"
                    ? typeSpecificData.target_chain_id
                    : String(typeSpecificData.target_chain_id ?? ""),
              type: mapJobType(jobDetail.job_data.task_definition_id),
              condition_type:
                typeof typeSpecificData.condition_type === "string"
                  ? typeSpecificData.condition_type
                  : undefined,
              upper_limit:
                typeof typeSpecificData.upper_limit === "number"
                  ? typeSpecificData.upper_limit
                  : typeof typeSpecificData.upper_limit === "string"
                    ? parseFloat(typeSpecificData.upper_limit)
                    : undefined,
              lower_limit:
                typeof typeSpecificData.lower_limit === "number"
                  ? typeSpecificData.lower_limit
                  : typeof typeSpecificData.lower_limit === "string"
                    ? parseFloat(typeSpecificData.lower_limit)
                    : undefined,
              value_source_url:
                typeof typeSpecificData.value_source_url === "string"
                  ? typeSpecificData.value_source_url
                  : undefined,
            };
          });
        devLog("[useJobs] tempJobs:", tempJobs);
        // As a safeguard, ensure only jobs from the connected chain are shown
        const chainFilteredJobs = tempJobs.filter(
          (j) => Number(j.created_chain_id) === Number(chainId),
        );
        // Sort by createdAt (newest first); tie-breaker by id desc
        const getTime = (isoString: string) => {
          const time = Date.parse(isoString);
          return Number.isNaN(time) ? -Infinity : time;
        };
        const sortedJobs = [...chainFilteredJobs].sort((a, b) => {
          const timeDiff = getTime(b.createdAt) - getTime(a.createdAt);
          if (timeDiff !== 0) return timeDiff;
          return b.id - a.id;
        });
        devLog("[useJobs] sortedJobs:", sortedJobs);
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
