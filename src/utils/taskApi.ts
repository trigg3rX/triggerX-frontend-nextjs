import { TaskData } from "@/components/task-table/TaskTable";

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
  console.log("API Response:", JSON.stringify(response).substring(0, 500));

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
    // console.log("Single task object detected");
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
    const response = await fetch(
      `${PROXY_API_URL}?filterType=user_address&filterValue=${encodeURIComponent(userAddress)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const data: TasksDataResponse = await response.json();
    return extractAllTasks(data);
  } catch (error) {
    console.error("Error fetching tasks by user address:", error);
    throw error;
  }
};

// Fetch tasks by job ID
export const fetchTasksByJobId = async (jobId: string): Promise<TaskData[]> => {
  try {
    const response = await fetch(
      `${PROXY_API_URL}?filterType=job_id&filterValue=${encodeURIComponent(jobId)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const data: TasksDataResponse = await response.json();
    return extractAllTasks(data);
  } catch (error) {
    console.error("Error fetching tasks by job ID:", error);
    throw error;
  }
};

// Fetch task by task ID
export const fetchTaskById = async (taskId: string): Promise<TaskData[]> => {
  try {
    const response = await fetch(
      `${PROXY_API_URL}?filterType=task_id&filterValue=${encodeURIComponent(taskId)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch task: ${response.statusText}`);
    }
    const data = await response.json();
    // console.log("Task ID Response - Full data:", data);
    // console.log("Task ID Response - Type:", typeof data);
    // console.log("Task ID Response - Is Array:", Array.isArray(data));

    const tasks = extractAllTasks(data);
    // console.log("Extracted tasks count:", tasks.length);
    // console.log("Extracted tasks:", tasks);

    return tasks;
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    throw error;
  }
};

// Fetch tasks by API key
export const fetchTasksByApiKey = async (
  apiKey: string,
): Promise<TaskData[]> => {
  try {
    const response = await fetch(
      `${PROXY_API_URL}?filterType=api_key&filterValue=${encodeURIComponent(apiKey)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const data: TasksDataResponse = await response.json();
    return extractAllTasks(data);
  } catch (error) {
    console.error("Error fetching tasks by API key:", error);
    throw error;
  }
};

// Fetch tasks by safe address
export const fetchTasksBySafeAddress = async (
  safeAddress: string,
): Promise<TaskData[]> => {
  try {
    const response = await fetch(
      `${PROXY_API_URL}?filterType=safe_address&filterValue=${encodeURIComponent(safeAddress)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    const data: TasksDataResponse = await response.json();
    return extractAllTasks(data);
  } catch (error) {
    console.error("Error fetching tasks by safe address:", error);
    throw error;
  }
};
