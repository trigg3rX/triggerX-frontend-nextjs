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
        description: "",
        content: React.createElement(
          "div",
          { className: "text-sm" },
          "{",
          React.createElement(
            "div",
            { className: "ml-4" },
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"account_balance"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `The current account balance`,
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"token_balance"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              'The current token balance"',
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"time_frames"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              "Applicable time frames for the job",
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"task_definition_ids"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `IDs of the task definitions`,
            ),
            ", ",
            React.createElement("br"),
          ),
          "}",
        ),
      },
      {
        status: "400",
        description: "",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Invalid input data",
          ),
        ),
      },
      {
        status: "401",
        description: "",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Invalid or missing API key",
          ),
        ),
      },
      {
        status: "404",
        description: "",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Resource not found",
          ),
        ),
      },
      {
        status: "500",
        description: "",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Server-side error",
          ),
        ),
      },
    ],
    requestSample: {
      language: "cURL",
      code: React.createElement(
        "div",
        { className: "text-[10px] sm:text-xs" },
        "{",
        React.createElement(
          "div",
          { className: "ml-4" },
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"job_title"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Test",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"user_address"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "0x...",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"ether_balance"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "1000000000000000000",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"token_balance"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "1000000000000000000",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"task_definition_id"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `1`,
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"priority"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `2`,
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"security"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `1`,
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"time_frame"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `3600`,
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"recurring"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `true`,
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"time_interval"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `300`,
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"trigger_chain_id"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "1",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"trigger_contract_address"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "0x...",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"trigger_event"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Transfer",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"script_ipfs_url"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "ipfs://...",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"script_trigger_function"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "checkCondition",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"target_chain_id"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "1",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"target_contract_address"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "0x...",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"target_function"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "execute",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"arg_type"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `1`,
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"arguments"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            '["arg1", "arg2"]',
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"script_target_function"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "executeAction",
          ),
          ", ",
          React.createElement("br"),
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"job_cost_prediction"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `0.05`,
          ),
          React.createElement("br"),
        ),
        "}",
      ),
    },
  },
  // {
  //   id: "retrievejobdata",
  //   name: "Retrieve Job Data",
  //   method: "GET",
  //   description:
  //     "Fetches detailed information about a specific automation job using its unique ID. Returns comprehensive data including job status, configuration, execution history, and associated parameters.",
  //   endpoint: "https://data.triggerx.network/api/jobs/{id}",
  //   headers: [
  //     {
  //       name: "TriggerX-Api-Key",
  //       type: "string",
  //       required: true,
  //       description: "Your unique API key.",
  //     },
  //     {
  //       name: "Content-Type",
  //       type: "application/json",
  //       required: true,
  //       description: "Specifies the content type.",
  //     },
  //   ],
  //   queryParams: [
  //     {
  //       name: "api_key",
  //       type: "string",
  //       description:
  //         "Alternative to using the TriggerX-Api-Key header for authentication",
  //     },
  //     {
  //       name: "columns",
  //       type: "string",
  //       description:
  //         "Comma-separated list of column names to return specific fields",
  //     },
  //     {
  //       name: "filters",
  //       type: "string",
  //       description: "SQL-like WHERE clause to filter results",
  //     },
  //   ],
  //   responses: [
  //     {
  //       status: "200",
  //       description: "Successful response with job details.",
  //       content: React.createElement(
  //         "div",
  //         { className: "text-sm" },
  //         "{",
  //         React.createElement(
  //           "div",
  //           { className: "ml-4" },
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"task_definition_id"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Task definition ID`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"user_id"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             "User ID"
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"link_job_id"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             "Linked job ID"
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"priority"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Job priority`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"security"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Security level`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"chain_status"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Status on the blockchain.`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"job_cost_prediction"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Predicted job cost.`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"time_frame"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Time frame for execution.`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"task_ids"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `List of task IDs.`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"last_executed_at"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Last execution timestamp.`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"target_chain_id"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Target chain ID`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"target_contract_addres"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Target Contract Address`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"target_function"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Target function name.`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"token_balance"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Token Balance`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"next_execution_timestamp"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `Next scheduled execution.`
  //           ),
  //           ", "
  //         ),
  //         "}"
  //       ),
  //     },
  //     {
  //       status: "400",
  //       description: "Bad Request",
  //       content: React.createElement(
  //         "div",
  //         { className: "ml-4" },

  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           "Invalid input data"
  //         )
  //       ),
  //     },
  //     {
  //       status: "401",
  //       description: "Unauthorized",
  //       content: React.createElement(
  //         "div",
  //         { className: "ml-4" },

  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           "Invalid or missing API key"
  //         )
  //       ),
  //     },
  //     {
  //       status: "404",
  //       description: "Not Found",
  //       content: React.createElement(
  //         "div",
  //         { className: "ml-4" },

  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           "Resource not found"
  //         )
  //       ),
  //     },
  //     {
  //       status: "500",
  //       description: "Internal Server Error",
  //       content: React.createElement(
  //         "div",
  //         { className: "ml-4" },

  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           "Server-side error"
  //         )
  //       ),
  //     },
  //   ],
  //   requestSample: {
  //     language: "cURL",
  //     code: React.createElement(
  //       "div",
  //       { className: "text-[10px] sm:text-xs" },
  //       "{",
  //       React.createElement(
  //         "div",
  //         { className: "ml-4" },
  //         React.createElement(
  //           "span",
  //           { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //           '"api_key"'
  //         ),
  //         ": ",
  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           "_"
  //         ),
  //         ", ",
  //         React.createElement("br"),
  //         React.createElement(
  //           "span",
  //           { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //           '"allow_partial_results"'
  //         ),
  //         ": ",
  //         React.createElement("span", { className: "text-[#C3E88D]" }, '"_"'),
  //         ", ",
  //         React.createElement("br"),
  //         React.createElement(
  //           "span",
  //           { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //           "columns"
  //         ),
  //         ": ",
  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           '"_"'
  //         ),
  //         ", ",
  //         React.createElement("br"),
  //         React.createElement(
  //           "span",
  //           { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //           "filters"
  //         ),
  //         ": ",
  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           '"_"'
  //         ),
  //         React.createElement("br")
  //       ),
  //       "}"
  //     ),
  //   },
  // },
  // {
  //   id: "joblastexecutedtimeapi",
  //   name: "Job Last Executed Time API",
  //   method: "PUT",
  //   description:
  //     "Updates the last execution timestamp for a specific automation job. This is used to track when the job was last run and manage scheduling for recurring tasks.",
  //   endpoint: "https://data.triggerx.network/api/jobs/{id}/lastexecuted",
  //   headers: [
  //     {
  //       name: "TriggerX-Api-Key",
  //       type: "string",
  //       required: true,
  //       description: "",
  //     },
  //     {
  //       name: "Content-Type",
  //       type: "application/json",
  //       required: true,
  //       description: "",
  //     },
  //   ],
  //   queryParams: [
  //     {
  //       name: "api_key",
  //       type: "string",
  //       description:
  //         "Alternative to using the TriggerX-Api-Key header for authentication",
  //     },
  //     {
  //       name: "columns",
  //       type: "string",
  //       description:
  //         "Comma-separated list of column names to return specific fields",
  //     },
  //     {
  //       name: "filters",
  //       type: "string",
  //       description: "SQL-like WHERE clause to filter results",
  //     },
  //   ],
  //   responses: [
  //     {
  //       status: "200",
  //       description: "Success",
  //       content: React.createElement(
  //         "div",
  //         { className: "text-sm" },
  //         "{",
  //         React.createElement(
  //           "div",
  //           { className: "ml-4" },
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"job_id"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             `"_"`
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"time_frame"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             '"_"'
  //           ),
  //           ", ",
  //           React.createElement("br"),
  //           React.createElement(
  //             "span",
  //             { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //             '"recurring"'
  //           ),
  //           ": ",
  //           React.createElement(
  //             "span",
  //             { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //             '"_"'
  //           )
  //         ),
  //         "}"
  //       ),
  //     },
  //     {
  //       status: "400",
  //       description: "Bad Request",
  //       content: React.createElement(
  //         "div",
  //         { className: "ml-4" },

  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           "Invalid input data"
  //         )
  //       ),
  //     },
  //     {
  //       status: "401",
  //       description: "Unauthorized",
  //       content: React.createElement(
  //         "div",
  //         { className: "ml-4" },

  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           "Invalid or missing API key"
  //         )
  //       ),
  //     },
  //     {
  //       status: "404",
  //       description: "Not Found",
  //       content: React.createElement(
  //         "div",
  //         { className: "ml-4" },

  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           "Resource not found"
  //         )
  //       ),
  //     },
  //     {
  //       status: "500",
  //       description: "Internal Server Error",
  //       content: React.createElement(
  //         "div",
  //         { className: "ml-4" },

  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           "Server-side error"
  //         )
  //       ),
  //     },
  //   ],

  //   requestSample: {
  //     language: "cURL",
  //     code: React.createElement(
  //       "div",
  //       { className: "text-sm" },
  //       "{",
  //       React.createElement(
  //         "div",
  //         { className: "ml-4" },
  //         React.createElement(
  //           "span",
  //           { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //           '"job_id"'
  //         ),
  //         ": ",
  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           "123"
  //         ),
  //         ", ",
  //         React.createElement("br"),
  //         React.createElement(
  //           "span",
  //           { className: "text-[#FF616D] text-[10px] sm:text-xs" },
  //           '"time_frame"'
  //         ),
  //         ": ",
  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           `7200`
  //         ),
  //         ", ",
  //         React.createElement("br"),
  //         React.createElement(
  //           "span",
  //           { className: "text-[#FF616D]" },
  //           '"recurring"'
  //         ),
  //         ": ",
  //         React.createElement(
  //           "span",
  //           { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
  //           `false`
  //         ),
  //         React.createElement("br")
  //       ),
  //       "}"
  //     ),
  //   },
  // },
  {
    id: "getjobsbyuseraddressapi",
    name: "Get Jobs By User Address API",
    method: "GET",
    description:
      "Fetch all jobs for the user associated with the provided API key. The API key must be sent in the request header. This endpoint is protected and only accessible with a valid API key.",
    endpoint: "https://data.triggerx.network/api/jobs/by-apikey",
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

        content: React.createElement(
          "div",
          { className: "text-sm" },
          "{",
          React.createElement(
            "div",
            { className: "ml-4" },
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"job_id"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `123`,
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"user_address"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              "0xabc...",
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"task_definition_id"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `1`,
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"chain_status"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `"_"`,
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"link_job_id"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `"_"`,
            ),
          ),
          "}",
        ),
      },
      {
        status: "400",
        description: "Bad Request",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Invalid API key",
          ),
        ),
      },
      {
        status: "401",
        description: "Unauthorized",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "No owner found for API key",
          ),
        ),
      },
      {
        status: "404",
        description: "Not Found",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "No jobs found for this user",
          ),
        ),
      },
      {
        status: "500",
        description: "Internal Server Error",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Missing X-Api-Key header",
          ),
        ),
      },
    ],
    requestSample: {
      language: "cURL",
      code: React.createElement(
        "div",
        { className: "text-[10px] sm:text-xs" },
        "{",
        React.createElement(
          "div",
          { className: "ml-4" },
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"curl -X GET https://data.triggerx.network/api/jobs/by-apikey"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "X-Api-Key: YOUR_API_KEY_HERE",
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
        content: React.createElement(
          "div",
          { className: "text-sm" },
          "{",
          React.createElement(
            "div",
            { className: "ml-4" },
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"message"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `Job deleted successfully`,
            ),

            ", ",
          ),
          "}",
        ),
      },
      {
        status: "400",
        description: "Bad Request",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Invalid input data",
          ),
        ),
      },
      {
        status: "401",
        description: "Unauthorized",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Invalid or missing API key",
          ),
        ),
      },
      {
        status: "404",
        description: "Not Found",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Resource not found",
          ),
        ),
      },
      {
        status: "500",
        description: "Internal Server Error",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Server-side error",
          ),
        ),
      },
    ],
    requestSample: {
      language: "cURL",
      code: React.createElement(
        "div",
        { className: "text-[10px] sm:text-xs" },
        "{",
        React.createElement(
          "div",
          { className: "ml-4" },
          React.createElement(
            "span",
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"id (Integer)"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "The ID of the job to delete",
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
    endpoint: "https://data.triggerx.network/api/users/:address",
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

        content: React.createElement(
          "div",
          { className: "text-sm" },
          "{",
          React.createElement(
            "div",
            { className: "ml-4" },
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"user_id"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `"_"`,
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"user_address"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              '"_"',
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"job_ids"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              '"_"',
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"account_balance"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              '"_"',
            ),
            ", ",
          ),
          "}",
        ),
      },
      {
        status: "400",
        description: "Bad Request",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Invalid input data",
          ),
        ),
      },
      {
        status: "401",
        description: "Unauthorized",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Invalid or missing API key",
          ),
        ),
      },
      {
        status: "404",
        description: "Not Found",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Resource not found",
          ),
        ),
      },
      {
        status: "500",
        description: "Internal Server Error",
        content: React.createElement(
          "div",
          { className: "ml-4" },

          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "Server-side error",
          ),
        ),
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
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"user_id"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `123`,
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"account_balance"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              "2000000000000000000",
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"token_balance"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              "1000000000000000000",
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"job_ids"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `[1, 2, 3]`,
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"task_definition_ids"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `[1, 2]`,
            ),
            ", ",
            React.createElement("br"),
            React.createElement(
              "span",
              { className: "text-[#FF616D] text-[10px] sm:text-xs" },
              '"time_frames"',
            ),
            ": ",
            React.createElement(
              "span",
              { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
              `[3600, 7200]`,
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
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"Bad Request"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
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
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"Unauthorized"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `Invalid or missing API key`,
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
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"Not Found"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `Resource not found`,
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
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"Internal Server Error"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            `Server-side error`,
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
            { className: "text-[#FF616D] text-[10px] sm:text-xs" },
            '"address"',
          ),
          ": ",
          React.createElement(
            "span",
            { className: "text-[#C3E88D] text-[10px] sm:text-xs" },
            "The address of the user to retrieve",
          ),
          React.createElement("br"),
        ),
        "}",
      ),
    },
  },
];
