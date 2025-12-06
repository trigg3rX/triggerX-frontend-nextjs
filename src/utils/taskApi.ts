import { TaskData } from "@/components/task-table/TaskTable";
import { devLog } from "@/lib/devLog";

// Use Next.js API route as proxy to avoid CORS issues
const PROXY_API_URL = "/api/tasks";

interface TaskApiResponse {
  task_id: number;
  task_number: number;
  task_opx_cost: number;
  execution_timestamp: string;
  execution_tx_hash: string;
  task_performer_id: number;
  task_attester_ids: number[];
  task_status: string;
  task_error: string;
  is_accepted: boolean;
  tx_url: string;
  converted_arguments: string[];
}

// RecentTaskResponse represents a task in the recent tasks list for the landing page
interface RecentTaskResponse {
  task_id: number;
  task_number: number;
  job_id: string;
  task_definition_id: number;
  created_at: string;
  task_opx_cost: number;
  execution_timestamp: string;
  execution_tx_hash: string;
  tx_url: string;
  task_performer_id: number;
  task_attester_ids: number[];
  task_status: string;
  task_error: string;
  is_imua: boolean;
}

interface TaskGroupApiResponse {
  job_id: string;
  tasks: TaskApiResponse[];
}

interface TasksDataResponse {
  task_groups: TaskGroupApiResponse[];
  user_address?: string;
}

// Union type for all possible API response formats
type ApiResponse =
  | TasksDataResponse // {task_groups: [...]}
  | { tasks: TaskApiResponse[] } // {tasks: [...]}
  | TaskApiResponse[] // [task1, task2, ...]
  | TaskApiResponse; // Single task object

// Transform API task data to TaskData format
const transformTaskData = (task: TaskApiResponse): TaskData => {
  return {
    id: task.task_id.toString(),
    taskNumber: task.task_number,
    txHash: task.execution_tx_hash || "",
    txUrl: task.tx_url,
    timestamp: task.execution_timestamp || "",
    status:
      task.task_status === "completed"
        ? "completed"
        : task.task_status === "failed"
          ? "failed"
          : "processing",
    operationCost: task.task_opx_cost || 0,
  };
};

// Transform RecentTaskResponse to TaskData format
const transformRecentTaskData = (task: RecentTaskResponse): TaskData => {
  return {
    id: task.task_id.toString(),
    taskNumber: task.task_number,
    txHash: task.execution_tx_hash || "",
    txUrl: task.tx_url,
    timestamp: task.execution_timestamp || "",
    status:
      task.task_status === "completed"
        ? "completed"
        : task.task_status === "failed"
          ? "failed"
          : "processing",
    operationCost: task.task_opx_cost || 0,
    jobId: task.job_id,
    performerId: task.task_performer_id,
    attesterIds: task.task_attester_ids,
  };
};

// Type guard functions
const hasTaskGroups = (
  response: ApiResponse,
): response is TasksDataResponse => {
  return (
    typeof response === "object" &&
    response !== null &&
    "task_groups" in response &&
    Array.isArray((response as TasksDataResponse).task_groups)
  );
};

const hasTasks = (
  response: ApiResponse,
): response is { tasks: TaskApiResponse[] } => {
  return (
    typeof response === "object" &&
    response !== null &&
    "tasks" in response &&
    Array.isArray((response as { tasks: TaskApiResponse[] }).tasks)
  );
};

const isTaskArray = (response: ApiResponse): response is TaskApiResponse[] => {
  return Array.isArray(response);
};

const isSingleTask = (response: ApiResponse): response is TaskApiResponse => {
  return (
    typeof response === "object" &&
    response !== null &&
    "task_id" in response &&
    !Array.isArray(response)
  );
};

// Extract all tasks from task groups
const extractAllTasks = (response: ApiResponse): TaskData[] => {
  const allTasks: TaskData[] = [];

  // Log the response to see its structure
  devLog("API Response:", JSON.stringify(response).substring(0, 500));

  // Check if response has task_groups
  if (!response) {
    console.error("Response is null or undefined");
    return allTasks;
  }

  // Handle different response structures
  if (hasTaskGroups(response)) {
    // Standard format: {task_groups: [{job_id, tasks: [...]}]}
    response.task_groups.forEach((group) => {
      if (group.tasks && Array.isArray(group.tasks) && group.tasks.length > 0) {
        group.tasks.forEach((task) => {
          allTasks.push(transformTaskData(task));
        });
      }
    });
  } else if (hasTasks(response)) {
    // Format: {tasks: [...]}
    response.tasks.forEach((task) => {
      allTasks.push(transformTaskData(task));
    });
  } else if (isTaskArray(response)) {
    // Format: [task1, task2, ...]
    response.forEach((task) => {
      allTasks.push(transformTaskData(task));
    });
  } else if (isSingleTask(response)) {
    // Format: Single task object {task_id: ..., task_number: ..., ...}
    allTasks.push(transformTaskData(response));
  } else {
    console.error("Unexpected response structure:", response);
  }

  return allTasks;
};

// Fetch tasks by user address
export const fetchTasksByUserAddress = async (
  userAddress: string,
): Promise<TaskData[]> => {
  try {
    const url = `${PROXY_API_URL}?filterType=user_address&filterValue=${encodeURIComponent(userAddress)}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("[fetchTasksByUserAddress] Response not OK:", {
        status: response.status,
        statusText: response.statusText,
      });
      // Handle 404 as empty results, not an error
      if (response.status === 404) {
        console.log(
          "[fetchTasksByUserAddress] 404 - No tasks found for this address",
        );
        return [];
      }
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const data: TasksDataResponse = await response.json();
    const tasks = extractAllTasks(data);
    return tasks;
  } catch (error) {
    console.error("[fetchTasksByUserAddress] Error:", error);
    throw error;
  }
};

// Fetch tasks by job ID
export const fetchTasksByJobId = async (jobId: string): Promise<TaskData[]> => {
  try {
    const url = `${PROXY_API_URL}?filterType=job_id&filterValue=${encodeURIComponent(jobId)}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("[fetchTasksByJobId] Response not OK:", {
        status: response.status,
        statusText: response.statusText,
      });
      // Handle 404 as empty results, not an error
      if (response.status === 404) {
        console.log("[fetchTasksByJobId] 404 - No tasks found for this job ID");
        return [];
      }
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const data: TasksDataResponse = await response.json();
    const tasks = extractAllTasks(data);
    return tasks;
  } catch (error) {
    console.error("[fetchTasksByJobId] Error:", error);
    throw error;
  }
};

// Fetch task by task ID
export const fetchTaskById = async (taskId: string): Promise<TaskData[]> => {
  try {
    const url = `${PROXY_API_URL}?filterType=task_id&filterValue=${encodeURIComponent(taskId)}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("[fetchTaskById] Response not OK:", {
        status: response.status,
        statusText: response.statusText,
      });
      // Handle 404 as empty results, not an error
      if (response.status === 404) {
        console.log("[fetchTaskById] 404 - No task found with this ID");
        return [];
      }
      throw new Error(`Failed to fetch task: ${response.statusText}`);
    }
    const data = await response.json();

    const tasks = extractAllTasks(data);

    return tasks;
  } catch (error) {
    console.error("[fetchTaskById] Error:", error);
    throw error;
  }
};

// Fetch tasks by API key
export const fetchTasksByApiKey = async (
  apiKey: string,
): Promise<TaskData[]> => {
  try {
    const url = `${PROXY_API_URL}?filterType=api_key&filterValue=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("[fetchTasksByApiKey] Response not OK:", {
        status: response.status,
        statusText: response.statusText,
      });
      // Handle 404 as empty results, not an error
      if (response.status === 404) {
        console.log(
          "[fetchTasksByApiKey] 404 - No tasks found for this API key",
        );
        return [];
      }
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const data: TasksDataResponse = await response.json();
    const tasks = extractAllTasks(data);
    return tasks;
  } catch (error) {
    console.error("[fetchTasksByApiKey] Error:", error);
    throw error;
  }
};

// Fetch tasks by safe address
export const fetchTasksBySafeAddress = async (
  safeAddress: string,
): Promise<TaskData[]> => {
  try {
    const url = `${PROXY_API_URL}?filterType=safe_address&filterValue=${encodeURIComponent(safeAddress)}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("[fetchTasksBySafeAddress] Response not OK:", {
        status: response.status,
        statusText: response.statusText,
      });
      // Handle 404 as empty results, not an error
      if (response.status === 404) {
        console.log(
          "[fetchTasksBySafeAddress] 404 - No tasks found for this safe address",
        );
        return [];
      }
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const data: TasksDataResponse = await response.json();
    const tasks = extractAllTasks(data);
    return tasks;
  } catch (error) {
    console.error("[fetchTasksBySafeAddress] Error:", error);
    throw error;
  }
};

// Extract recent tasks from various response formats
const extractRecentTasks = (response: unknown): TaskData[] => {
  const allTasks: TaskData[] = [];

  if (!response) {
    console.error("Response is null or undefined");
    return allTasks;
  }

  // Handle array of RecentTaskResponse
  if (Array.isArray(response)) {
    response.forEach((task) => {
      if (task && typeof task === "object" && "task_id" in task) {
        allTasks.push(transformRecentTaskData(task as RecentTaskResponse));
      }
    });
    return allTasks;
  }

  // Handle object with tasks array
  if (
    typeof response === "object" &&
    response !== null &&
    "tasks" in response &&
    Array.isArray((response as { tasks: unknown[] }).tasks)
  ) {
    (response as { tasks: RecentTaskResponse[] }).tasks.forEach((task) => {
      allTasks.push(transformRecentTaskData(task));
    });
    return allTasks;
  }

  // Handle single task object
  if (
    typeof response === "object" &&
    response !== null &&
    "task_id" in response &&
    !Array.isArray(response)
  ) {
    allTasks.push(transformRecentTaskData(response as RecentTaskResponse));
    return allTasks;
  }

  console.error("Unexpected recent tasks response structure:", response);
  return allTasks;
};

// Fetch recent tasks for the landing page
export const fetchRecentTasks = async (): Promise<TaskData[]> => {
  try {
    const url = `${PROXY_API_URL}?filterType=recent`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("[fetchRecentTasks] Response not OK:", {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Failed to fetch recent tasks: ${response.statusText}`);
    }
    const data = await response.json();
    devLog("[fetchRecentTasks] Raw response:", {
      type: typeof data,
      isArray: Array.isArray(data),
      arrayLength: Array.isArray(data) ? data.length : undefined,
      dataKeys:
        typeof data === "object" && data !== null ? Object.keys(data) : [],
      dataPreview: JSON.stringify(data).substring(0, 500),
    });
    const tasks = extractRecentTasks(data);
    return tasks;
  } catch (error) {
    console.error("[fetchRecentTasks] Error:", error);
    throw error;
  }
};
