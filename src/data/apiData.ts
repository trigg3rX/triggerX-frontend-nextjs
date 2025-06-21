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
  },
  {
    id: "retrivejobdata",
    name: "Retrive Job Data",
    method: "POST",
    description:
      "Creates a new blockchain automation job with specified parameters. Define trigger conditions, target actions, security levels, and scheduling options. Supports both one-time and recurring executions with customizable time intervals.",
    endpoint: "https://data.triggerx.network/api/jobs/{id}",
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
  },
  {
    id: "joblastexecutedtimeapi",
    name: "Job Last Executed Time API",
    method: "POST",
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
  },
  {
    id: "joblastexecutedtimeapi",
    name: "Get Jobs By User Address API",
    method: "POST",
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
  },
];
