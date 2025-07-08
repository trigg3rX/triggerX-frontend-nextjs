import { devLog } from "@/lib/devLog";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

export type JobType = {
  id: number;
  jobTitle: string;
  taskDefinitionId: string;
  status: string;
  job_cost_actual: string;
  timeFrame: string;
  argType: string;
  timeInterval: string;
  targetContractAddress: string;
  createdAt: string;
  targetFunction: string;
  targetChainId: string;
  linkedJobs?: JobType[];
  type: string;
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
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!address) {
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
        const apiUrl = `${API_BASE_URL}/api/jobs/user/${address}`;
        devLog("[useJobs] Fetching jobs from:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
          if (response.status === 404) {
            setJobs([]);
            setError(null); // treat as empty, not error
            setLoading(false);
            return;
          }
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

                status: "Active",
                job_cost_actual: nextJob.job_data.job_cost_actual,
                timeFrame: nextJob.job_data.time_frame || "",
                argType:
                  typeof typeSpecificData.arg_type === "string"
                    ? typeSpecificData.arg_type
                    : String(typeSpecificData.arg_type ?? ""),
                timeInterval:
                  typeof typeSpecificData.time_interval === "string"
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
                linkedJobs: [],
                type: mapJobType(nextJob.job_data.task_definition_id),
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
              status: "Active",
              linkedJobs: linkedJobsMap[jobDetail.job_data.job_id] || [],
              job_cost_actual: jobDetail.job_data.job_cost_actual,
              timeFrame: jobDetail.job_data.time_frame || "",
              argType:
                typeof typeSpecificData.arg_type === "string"
                  ? typeSpecificData.arg_type
                  : String(typeSpecificData.arg_type ?? ""),
              timeInterval:
                typeof typeSpecificData.time_interval === "string"
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
              type: mapJobType(jobDetail.job_data.task_definition_id),
            };
          });
        devLog("[useJobs] tempJobs:", tempJobs);
        setJobs(tempJobs);
        setError(null);
      } catch (err: unknown) {
        console.error("[useJobs] Error:", err);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
        // console.log("[useJobs] Loading finished.");
      }
    };
    fetchJobs();
  }, [address]);

  return { jobs, loading, error };
}
