import { devLog } from "@/lib/devLog";
import { JobType } from "@/hooks/useJobs";

export const mapJobType = (taskDefinitionId: string) => {
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

export interface JobsApiResponse {
  jobs: RawJobData[];
}

// Types for raw API data
export interface RawJobData {
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
    created_chain_id?: string;
    is_active?: boolean;
    next_execution_timestamp?: string;
  };
  time_job_data?: Record<string, unknown>;
  event_job_data?: Record<string, unknown>;
  condition_job_data?: Record<string, unknown>;
}

const transformSingleJob = (
  jobDetail: RawJobData,
  typeSpecificData: Record<string, unknown>,
): JobType => {
  return {
    id: jobDetail.job_data.job_id,
    jobTitle: jobDetail.job_data.job_title,
    taskDefinitionId: mapJobType(jobDetail.job_data.task_definition_id),
    raw_task_definition_id: String(jobDetail.job_data.task_definition_id),
    is_active: typeSpecificData.is_active === true,
    next_execution_timestamp:
      mapJobType(jobDetail.job_data.task_definition_id) === "Time-based"
        ? typeof typeSpecificData.next_execution_timestamp === "string"
          ? typeSpecificData.next_execution_timestamp
          : undefined
        : undefined,
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
    linkedJobs: [],
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
};

/**
 * Transform raw job API response into JobType[] with linked jobs
 */
export const transformJobsResponse = (
  jobsData: JobsApiResponse,
  chainId?: number,
  logPrefix = "[jobsMapper]",
): JobType[] => {
  devLog(`${logPrefix} Raw jobsData:`, jobsData);

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

        const processedLinkedJob = transformSingleJob(
          nextJob,
          typeSpecificData,
        );
        linkedJobs.push(processedLinkedJob);
        nextJobId = nextJob.job_data.link_job_id;
      }

      linkedJobsMap[mainJobId] = linkedJobs;
    }
  });

  devLog(`${logPrefix} linkedJobsMap:`, linkedJobsMap);

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

      const job = transformSingleJob(jobDetail, typeSpecificData);
      job.linkedJobs = linkedJobsMap[jobDetail.job_data.job_id] || [];
      return job;
    });

  devLog(`${logPrefix} tempJobs:`, tempJobs);

  // Filter by chain if provided
  const chainFilteredJobs =
    typeof chainId !== "undefined"
      ? tempJobs.filter((j) => Number(j.created_chain_id) === Number(chainId))
      : tempJobs;

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

  devLog(`${logPrefix} sortedJobs:`, sortedJobs);
  return sortedJobs;
};
