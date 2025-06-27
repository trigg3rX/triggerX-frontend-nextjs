import React from "react";

// Define the types for our data
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiParameter {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

export interface ApiResponse {
  status: string;
  description: string;
  // Can be a structured list of fields or a simple code block
  content: ApiParameter[] | React.ReactNode;
}

export interface ApiRequestSample {
  language: string;
  code: React.ReactNode;
}

export interface ApiEndpoint {
  id: string; // A unique ID like "createautomationjob"
  name: string; // Human-readable name like "Create Automation Job"
  method: HttpMethod;
  description: string;
  endpoint: string;
  endpointPath?: string; // For parts like "{id}"
  headers: ApiParameter[];
  queryParams?: ApiParameter[];
  responses: ApiResponse[];
  requestSample?: ApiRequestSample; // Assuming one sample for now
  responseSamples?: ApiResponse[]; // For the second style of response viewer
}

// Now, let's populate our data using these types
export const apiData: ApiEndpoint[] = [
  {
    id: "createautomationjob",
    name: "Create Automation Job",
    method: "POST",
    description:
      "Creates a new blockchain automation job with specified parameters. Define trigger conditions, target actions, security levels, and scheduling options. Supports both one-time and recurring executions with customizable time intervals.",
    endpoint: "https://data.triggerx.network/api/jobs",
    headers: [
      {
        name: "TriggerX-Api-Key",
        type: "string",
        required: true,
        description: "Your unique API key.",
      },
      {
        name: "Content-Type",
        type: "application/json",
        required: true,
        description: "Specifies the content type.",
      },
    ],
    queryParams: [
      {
        name: "api_key",
        type: "string",
        description:
          "Alternative to using the TriggerX-Api-Key header for authentication",
      },
      {
        name: "columns",
        type: "string",
        description:
          "Comma-separated list of column names to return specific fields",
      },
      {
        name: "filters",
        type: "string",
        description: "SQL-like WHERE clause to filter results",
      },
    ],

    responses: [
      {
        status: "200",
        content: [
          {
            name: "account_balance",
            type: "string",
            description: "The current account balance.",
          },
          {
            name: "token_balance",
            type: "string",
            description: "The current token balance.",
          },
          {
            name: "time_frames",
            type: "string",
            description: "Applicable time frames for the job.",
          },
          {
            name: "task_definition_ids",
            type: "string",
            description: "IDs of the task definitions.",
          },
        ],
        description: "",
      },
      {
        status: "400",
        description: "",
        content: "Invalid input data",
      },
      {
        status: "401",
        description: "",
        content: "Invalid or missing API key",
      },
      {
        status: "404",
        description: "",
        content: "Resource not found",
      },
      {
        status: "500",
        description: "",
        content: "Server-side error",
      },
    ],
    requestSample: {
      language: "cURL",
      code: React.createElement(
        "div",
        { className: "text-sm" },
        "{",
        React.createElement(
          "div",
          { className: "ml-4" },
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"job_title"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"Test"',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"user_address"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"0x..."',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"ether_balance"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"1000000000000000000"',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"token_balance"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"1000000000000000000"',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"task_definition_id"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, "1"),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"priority"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, "2"),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"security"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, "1"),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"time_frame"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, "3600"),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"recurring"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, "true"),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"time_interval"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, "300"),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"trigger_chain_id"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, '"1"'),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"trigger_contract_address"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"0x..."',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"trigger_event"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"Transfer"',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"script_ipfs_url"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"ipfs://..."',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"script_trigger_function"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"checkCondition"',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"target_chain_id"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, '"1"'),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"target_contract_address"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"0x..."',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"target_function"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"execute"',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"arg_type"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, "1"),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"arguments"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '["arg1", "arg2"]',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"script_target_function"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"executeAction"',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"job_cost_prediction"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, "0.05"),
          React.createElement("br"),
        ),
        "}",
      ),
    },
  },
  {
    id: "retrievejobdata",
    name: "Retrieve Job Data",
    method: "GET",
    description:
      "Fetches detailed information about a specific automation job using its unique ID. Returns comprehensive data including job status, configuration, execution history, and associated parameters.",
    endpoint: "https://data.triggerx.network/api/jobs/{id}",
    headers: [
      {
        name: "TriggerX-Api-Key",
        type: "string",
        required: true,
        description: "Your unique API key.",
      },
      {
        name: "Content-Type",
        type: "application/json",
        required: true,
        description: "Specifies the content type.",
      },
    ],
    queryParams: [
      {
        name: "api_key",
        type: "string",
        description:
          "Alternative to using the TriggerX-Api-Key header for authentication",
      },
      {
        name: "columns",
        type: "string",
        description:
          "Comma-separated list of column names to return specific fields",
      },
      {
        name: "filters",
        type: "string",
        description: "SQL-like WHERE clause to filter results",
      },
    ],
    responses: [
      {
        status: "200",
        description: "Successful response with job details.",
        content: [
          {
            name: "job_id",
            type: "string",
            description: "Unique job identifier.",
          },
          {
            name: "task_definition_id",
            type: "string",
            description: "Task definition ID.",
          },
          { name: "user_id", type: "string", description: "User ID." },
          {
            name: "link_job_id",
            type: "string",
            description: "Linked job ID.",
          },
          { name: "priority", type: "number", description: "Job priority." },
          { name: "security", type: "number", description: "Security level." },
          {
            name: "chain_status",
            type: "number",
            description: "Status on the blockchain.",
          },
          {
            name: "recurring",
            type: "boolean",
            description: "Whether the job is recurring.",
          },
          {
            name: "job_cost_prediction",
            type: "number",
            description: "Predicted job cost.",
          },
          {
            name: "time_frame",
            type: "string",
            description: "Time frame for execution.",
          },
          {
            name: "created_at",
            type: "string",
            description: "Creation timestamp.",
          },
          {
            name: "last_executed_at",
            type: "string",
            description: "Last execution timestamp.",
          },
          {
            name: "task_ids",
            type: "string",
            description: "List of task IDs.",
          },
          {
            name: "target_chain_id",
            type: "string",
            description: "Target chain ID.",
          },
          {
            name: "target_contract_address",
            type: "string",
            description: "Target contract address.",
          },
          {
            name: "target_function",
            type: "string",
            description: "Target function name.",
          },
          {
            name: "token_balance",
            type: "string",
            description: "Token balance.",
          },
          {
            name: "next_execution_timestamp",
            type: "string",
            description: "Next scheduled execution.",
          },
        ],
      },
      {
        status: "400",
        description: "Bad Request",
        content: "Invalid input data",
      },
      {
        status: "401",
        description: "Unauthorized",
        content: "Invalid or missing API key",
      },
      {
        status: "404",
        description: "Not Found",
        content: "Resource not found",
      },
      {
        status: "500",
        description: "Internal Server Error",
        content: "Server-side error",
      },
    ],
    requestSample: {
      language: "cURL",
      code: React.createElement(
        "div",
        { className: "text-sm" },
        "{",
        React.createElement(
          "div",
          { className: "ml-4" },
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"api_key"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, '"_"'),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"allow_partial_results"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, '"_"'),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"columns"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, '"_"'),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"filters"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, '"_"'),
          React.createElement("br"),
        ),
        "}",
      ),
    },
  },
  {
    id: "joblastexecutedtimeapi",
    name: "Job Last Executed Time API",
    method: "PUT",
    description:
      "Updates the last execution timestamp for a specific automation job. This is used to track when the job was last run and manage scheduling for recurring tasks.",
    endpoint: "https://data.triggerx.network/api/jobs/{id}/lastexecuted",
    headers: [
      {
        name: "TriggerX-Api-Key",
        type: "string",
        required: true,
        description: "",
      },
      {
        name: "Content-Type",
        type: "application/json",
        required: true,
        description: "",
      },
    ],
    queryParams: [
      {
        name: "api_key",
        type: "string",
        description:
          "Alternative to using the TriggerX-Api-Key header for authentication",
      },
      {
        name: "columns",
        type: "string",
        description:
          "Comma-separated list of column names to return specific fields",
      },
      {
        name: "filters",
        type: "string",
        description: "SQL-like WHERE clause to filter results",
      },
    ],
    responses: [
      {
        status: "200",
        description: "Success",
        content: [
          {
            name: "job_id",
            type: "string",
            description: "_",
          },
          {
            name: "time_frame",
            type: "string",
            description: "_",
          },
          {
            name: "recurring",
            type: "string",
            description: "_",
          },
        ],
      },
      {
        status: "400",
        description: "Bad Request",
        content: "Invalid input data",
      },
      {
        status: "401",
        description: "Unauthorized",
        content: "Invalid or missing API key",
      },
      {
        status: "404",
        description: "Not Found",
        content: "Resource not found",
      },
      {
        status: "500",
        description: "Internal Server Error",
        content: "Server-side error",
      },
    ],
    requestSample: {
      language: "cURL",
      code: React.createElement(
        "div",
        { className: "text-sm" },
        "{",
        React.createElement(
          "div",
          { className: "ml-4" },
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"job_id"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"123  "',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"time_frame"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, "7200"),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"recurring"',
          ),
          ": ",
          React.createElement("span", { className: "text-[#C3E88D]" }, "false"),
          React.createElement("br"),
        ),
        "}",
      ),
    },
  },
  {
    id: "getjobsbyuseraddressapi",
    name: "Get Jobs By User Address API",
    method: "GET",
    description:
      "Retrieve all automation jobs associated with a specific user's Ethereum wallet address. This endpoint returns detailed information about each job owned by the user.",
    endpoint: "https://data.triggerx.network/api/jobs/user/{user_address}",
    headers: [
      {
        name: "TriggerX-Api-Key",
        type: "string",
        required: true,
        description: "Your unique API key.",
      },
      {
        name: "Content-Type",
        type: "application/json",
        required: true,
        description: "Specifies the content type.",
      },
    ],
    queryParams: [
      {
        name: "api_key",
        type: "string",
        description:
          "Alternative to using the TriggerX-Api-Key header for authentication",
      },
      {
        name: "columns",
        type: "string",
        description:
          "Comma-separated list of column names to return specific fields",
      },
      {
        name: "filters",
        type: "string",
        description: "SQL-like WHERE clause to filter results",
      },
    ],
    responses: [
      {
        status: "200",
        description: "Success",
        content: [
          { name: "job_id", type: "string", description: "" },
          { name: "job_type", type: "string", description: "" },
          {
            name: "status",
            type: "boolean",
            description: "Comma-separated list of columns to return",
          },
          {
            name: "chain_status",
            type: "string",
            description: "Comma-separated list of columns to return",
          },
          {
            name: "link_job_id",
            type: "string",
            description: "Comma-separated list of columns to return",
          },
        ],
      },
      {
        status: "400",
        description: "Bad Request",
        content: "Invalid input data",
      },
      {
        status: "401",
        description: "Unauthorized",
        content: "Invalid or missing API key",
      },
      {
        status: "404",
        description: "Not Found",
        content: "Resource not found",
      },
      {
        status: "500",
        description: "Internal Server Error",
        content: "Server-side error",
      },
    ],
    requestSample: {
      language: "cURL",
      code: React.createElement(
        "div",
        { className: "text-sm" },
        "{",
        React.createElement(
          "div",
          { className: "ml-4" },
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"user_address (string)"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"Ethereum wallet address of the user"',
          ),
          React.createElement("br"),
        ),
        "}",
      ),
    },
  },
  {
    id: "deletejobapi",
    name: "Delete Job API",
    method: "PUT",
    description:
      "Delete an existing automation job by its ID. This action cannot be undone.",
    endpoint: "https://data.triggerx.network/api/jobs/delete/{id}",
    headers: [
      {
        name: "TriggerX-Api-Key",
        type: "string",
        required: true,
        description: "Your unique API key.",
      },
      {
        name: "Content-Type",
        type: "application/json",
        required: true,
        description: "Specifies the content type.",
      },
    ],
    queryParams: [
      {
        name: "api_key",
        type: "string",
        description:
          "Alternative to using the TriggerX-Api-Key header for authentication",
      },
      {
        name: "columns",
        type: "string",
        description:
          "Comma-separated list of column names to return specific fields",
      },
      {
        name: "filters",
        type: "string",
        description: "SQL-like WHERE clause to filter results",
      },
    ],

    responses: [
      {
        status: "200",
        description: "Success",
        content: [
          {
            name: "message",
            type: "string",
            description: "Job deleted successfully",
          },
        ],
      },
      {
        status: "400",
        description: "Bad Request",
        content: "Invalid input data",
      },
      {
        status: "401",
        description: "Unauthorized",
        content: "Invalid or missing API key",
      },
      {
        status: "404",
        description: "Not Found",
        content: "Resource not found",
      },
      {
        status: "500",
        description: "Internal Server Error",
        content: "Server-side error",
      },
    ],
    requestSample: {
      language: "cURL",
      code: React.createElement(
        "div",
        { className: "text-sm" },
        "{",
        React.createElement(
          "div",
          { className: "ml-4" },
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"id (Integer)"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"The ID of the job to delete"',
          ),
          React.createElement("br"),
        ),
        "}",
      ),
    },
  },
  {
    id: "getuserapi",
    name: "Get User API",
    method: "GET",
    description:
      "Retrieve user information including their job IDs and account balance.",
    endpoint: "https://data.triggerx.network/api/users/{id}",
    headers: [
      {
        name: "TriggerX-Api-Key",
        type: "string",
        required: true,
        description: "Your unique API key.",
      },
      {
        name: "Content-Type",
        type: "application/json",
        required: true,
        description: "Specifies the content type.",
      },
    ],
    queryParams: [
      {
        name: "api_key",
        type: "string",
        description:
          "Alternative to using the TriggerX-Api-Key header for authentication",
      },
      {
        name: "columns",
        type: "string",
        description:
          "Comma-separated list of column names to return specific fields",
      },
      {
        name: "filters",
        type: "string",
        description: "SQL-like WHERE clause to filter results",
      },
    ],
    responses: [
      {
        status: "200",
        description: "Success",
        content: [
          { name: "user_id", type: "string", description: "" },
          { name: "user_address", type: "string", description: "" },
          { name: "job_ids", type: "string", description: "" },
          { name: "account_balance", type: "string", description: "" },
        ],
      },
      {
        status: "400",
        description: "Bad Request",
        content: "Invalid input data",
      },
      {
        status: "401",
        description: "Unauthorized",
        content: "Invalid or missing API key",
      },
      {
        status: "404",
        description: "Not Found",
        content: "Resource not found",
      },
      {
        status: "500",
        description: "Internal Server Error",
        content: "Server-side error",
      },
    ],
    responseSamples: [
      {
        status: "200",
        description: "Success Example",
        content: React.createElement(
          "div",
          { className: "text-sm" },
          "{",
          React.createElement(
            "div",
            { className: "ml-4" },
            React.createElement(
              "span",
              { className: "text-[#FF616D]" },
              '"user_id"',
            ),
            ": ",
            React.createElement("span", { className: "text-[#C3E88D]" }, "123"),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D]" },
              '"account_balance"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D]" },
              '"2000000000000000000"',
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D]" },
              '"token_balance"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D]" },
              '"1000000000000000000"',
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D]" },
              '"job_ids"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D]" },
              "[1, 2, 3]",
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D]" },
              '"task_definition_ids"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D]" },
              "[1, 2]",
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D]" },
              '"time_frames"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D]" },
              "[3600, 7200]",
            ),
          ),
          "}",
        ),
      },
      {
        status: "400",
        description: "Bad Request Example",
        content: React.createElement(
          "div",
          { className: "ml-4" },
          "{",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"Bad Request"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            "Invalid input data",
          ),
          ", ",
          React.createElement("br"),
          "}",
        ),
      },
      {
        status: "401",
        description: "Unauthorized Example",
        content: React.createElement(
          "div",
          { className: "ml-4" },
          "{",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"Unauthorized"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            "Invalid or missing API key",
          ),
          ", ",
          React.createElement("br"),
          "}",
        ),
      },
      {
        status: "403",
        description: "Not Found Example",
        content: React.createElement(
          "div",
          { className: "ml-4" },
          "{",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"Not Found"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            "Resource not found",
          ),
          ", ",
          React.createElement("br"),
          "}",
        ),
      },
      {
        status: "500",
        description: "Internal Server Error Example",
        content: React.createElement(
          "div",
          { className: "ml-4" },
          "{",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"Internal Server Error"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            "Server-side error",
          ),
          ", ",
          React.createElement("br"),
          "}",
        ),
      },
    ],
    requestSample: {
      language: "cURL",
      code: React.createElement(
        "div",
        { className: "text-sm" },
        "{",
        React.createElement(
          "div",
          { className: "ml-4" },
          React.createElement(
            "span",
            { className: "text-[#FF616D]" },
            '"id (Integer)"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D]" },
            '"The ID of the user to retrieve"',
          ),
          React.createElement("br"),
        ),
        "}",
      ),
    },
  },
];
