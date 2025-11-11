import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../leaderboard/Table";
import type { JobLog } from "@/hooks/useJobLogsHybrid";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";
import { ExternalLink, ChevronDownIcon } from "lucide-react";
import scrollbarStyles from "@/app/styles/scrollbar.module.css";

interface JobLogsTableProps {
  logs: JobLog[];
  error?: string;
  isConnected?: boolean;
  isConnecting?: boolean;
  useWebSocketMode?: boolean;
  taskDefinitionId?: string; // For determining if converted_arguments should be shown
}

/** Mobile-friendly card view of logs with the same error/empty states as the table. */
const JobLogsMobileView: React.FC<JobLogsTableProps> = ({
  logs,
  error,
  taskDefinitionId,
}) => {
  // Show all logs if 11 or more, otherwise limit to 10
  const shouldShowAll = logs.length >= 11;
  const displayLogs = shouldShowAll ? logs : logs.slice(0, 10);
  const shouldScroll = logs.length > 10;

  return (
    <div className="xl:hidden w-full">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h3" color="primary">
          Job Logs
        </Typography>
      </div>

      <div
        className={`grid grid-cols-1   gap-4 ${shouldScroll ? `max-h-[600px] overflow-y-auto ${scrollbarStyles.customScrollbar}` : ""}`}
        style={shouldScroll ? { maxHeight: 600 } : {}}
      >
        {error ? (
          <Card className="mb-4">
            <Typography className="text-center text-red-400">
              {error}
            </Typography>
          </Card>
        ) : logs.length === 0 ? (
          <Card className="mb-4">
            <Typography className="text-center text-red-400">
              No logs found.
            </Typography>
          </Card>
        ) : (
          displayLogs.map((log) => {
            const hasValidTimestamp =
              !!log.execution_timestamp &&
              log.execution_timestamp !== "0001-01-01T00:00:00Z";

            return (
              <Card key={`${log.task_id}-${log.task_number}`} className="mb-2">
                <div className="flex flex-col gap-2 ">
                  <div className="flex justify-between  py-1">
                    <Typography variant="body" color="primary" align="left">
                      Task Number
                    </Typography>
                    <Typography color="gray">{log.task_number}</Typography>
                  </div>
                  <div className="flex justify-between  py-1">
                    <Typography color="primary" variant="body" align="left">
                      Timestamp
                    </Typography>
                    <Typography color="gray">
                      {hasValidTimestamp
                        ? new Date(log.execution_timestamp).toLocaleString()
                        : "-"}
                    </Typography>
                  </div>
                  <div className="flex justify-between  py-1">
                    <Typography color="primary" variant="body" align="left">
                      Status
                    </Typography>
                    <Typography color="gray">
                      {log.task_status === "failed" ? (
                        <span className="text-red-400">Failed</span>
                      ) : log.task_status === "completed" ? (
                        <span className="text-green-400">Completed</span>
                      ) : (
                        <span className="text-yellow-400">Processing</span>
                      )}
                    </Typography>
                  </div>
                  <div className="flex justify-between   py-1">
                    <Typography color="primary" variant="body" align="left">
                      Operation Cost
                    </Typography>
                    <Typography color="gray">{log.task_opx_cost}</Typography>
                  </div>
                  <div className="flex justify-between  py-1">
                    <Typography color="primary" variant="body" align="left">
                      Tx Hash
                    </Typography>
                    <Typography color="gray">
                      {log.tx_url && log.execution_tx_hash ? (
                        <a
                          href={
                            log.tx_url
                              ?.replace(/^https:\/(?!\/)/, "https://")
                              ?.replace(/^http:\/(?!\/)/, "http://")
                              ?.match(/^https?:\/\//)
                              ? log.tx_url
                                  .replace(/^https:\/(?!\/)/, "https://")
                                  .replace(/^http:\/(?!\/)/, "http://")
                              : `https://${log.tx_url.replace(/^\/+/, "")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-[#F8ff7c]/80 "
                        >
                          {log.execution_tx_hash.slice(0, 8)}...
                          {log.execution_tx_hash.slice(-6)}
                        </a>
                      ) : (
                        <span>-</span>
                      )}
                    </Typography>
                  </div>
                  {/* Show converted_arguments for task_definition_id 2, 4, 6 */}
                  {(taskDefinitionId === "2" ||
                    taskDefinitionId === "4" ||
                    taskDefinitionId === "6") && (
                    <div className="flex justify-between py-1">
                      <Typography color="primary" variant="body" align="left">
                        Converted Arguments
                      </Typography>
                      <Typography color="gray" className="break-all">
                        {log.converted_arguments || "-"}
                      </Typography>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

const JobLogsTable: React.FC<JobLogsTableProps> = ({
  logs,
  error,
  isConnected,
  isConnecting,
  useWebSocketMode,
  taskDefinitionId,
}) => {
  // Debug logging for visibility into data flow; safe to keep as low-noise
  console.log("JobLogsTable props:", {
    logs,
    error,
    isConnected,
    isConnecting,
    useWebSocketMode,
    logsLength: logs?.length || 0,
  });

  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "desc",
  );

  const sortedLogs = React.useMemo(() => {
    const isValidTimestamp = (ts?: string) =>
      !!ts && ts !== "0001-01-01T00:00:00Z";

    return [...logs].sort((a, b) => {
      const aValid = isValidTimestamp(a.execution_timestamp);
      const bValid = isValidTimestamp(b.execution_timestamp);

      if (aValid && bValid) {
        const aTime = new Date(a.execution_timestamp).getTime();
        const bTime = new Date(b.execution_timestamp).getTime();
        if (bTime !== aTime)
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
        // tie-breaker on task number based on sort direction for consistency
        return sortDirection === "asc"
          ? a.task_number - b.task_number
          : b.task_number - a.task_number;
      }
      if (aValid && !bValid) return -1; // valid timestamps first
      if (!aValid && bValid) return 1;
      // both invalid -> fall back to task number
      return sortDirection === "asc"
        ? a.task_number - b.task_number
        : b.task_number - a.task_number;
    });
  }, [logs, sortDirection]);

  // Show all logs if 11 or more, otherwise limit to 10
  const shouldShowAll = sortedLogs.length >= 11;
  const displayLogs = shouldShowAll ? sortedLogs : sortedLogs.slice(0, 10);
  const shouldScroll = sortedLogs.length > 10;

  return (
    <>
      {/* Desktop/tablet view */}
      <div className="hidden xl:block w-full">
        <div className="flex justify-between items-center mb-4 ">
          <Typography variant="h3" color="primary" align="left">
            Job Logs
          </Typography>
        </div>
        <div
          className={`overflow-auto max-h-[500px] ${scrollbarStyles.customScrollbar}`}
          style={shouldScroll ? { maxHeight: 500 } : {}}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[#1A1A1A] border-b border-[#2A2A2A] ">
              <TableRow className="whitespace-nowrap">
                <TableHead>Task Number</TableHead>
                <TableHead>Tx Hash</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() =>
                    setSortDirection((prev) =>
                      prev === "asc" ? "desc" : "asc",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    <span>Timestamp</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform ${
                        sortDirection === "asc" ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Operation Cost</TableHead>
                {/* Show converted_arguments column for task_definition_id 2, 4, 6 */}
                {(taskDefinitionId === "2" ||
                  taskDefinitionId === "4" ||
                  taskDefinitionId === "6") && (
                  <TableHead>Converted Arguments</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      taskDefinitionId === "2" ||
                      taskDefinitionId === "4" ||
                      taskDefinitionId === "6"
                        ? 6
                        : 5
                    }
                    className="text-center text-red-400"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      taskDefinitionId === "2" ||
                      taskDefinitionId === "4" ||
                      taskDefinitionId === "6"
                        ? 6
                        : 5
                    }
                    className="text-center"
                  >
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                displayLogs.map((log) => {
                  const hasValidTimestamp =
                    !!log.execution_timestamp &&
                    log.execution_timestamp !== "0001-01-01T00:00:00Z";

                  return (
                    <TableRow
                      key={`${log.task_id}-${log.task_number}`}
                      className="group"
                    >
                      <TableCell
                        className={`border-l-4 px-6 py-4 ${
                          log.task_status === "completed"
                            ? "border-green-500"
                            : log.task_status === "failed"
                              ? "border-red-500"
                              : "border-yellow-500"
                        }`}
                      >
                        <Typography variant="body" color="primary" align="left">
                          {log.task_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.tx_url && log.execution_tx_hash ? (
                          <div className="flex items-center gap-2">
                            <Typography
                              variant="body"
                              color="primary"
                              align="left"
                            >
                              <a
                                href={
                                  log.tx_url
                                    ?.replace(/^https:\/(?!\/)/, "https://")
                                    ?.replace(/^http:\/(?!\/)/, "http://")
                                    ?.match(/^https?:\/\//)
                                    ? log.tx_url
                                        .replace(/^https:\/(?!\/)/, "https://")
                                        .replace(/^http:\/(?!\/)/, "http://")
                                    : `https://${log.tx_url.replace(/^\/+/, "")}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline-offset-2 pt-1 hover:text-[#F8ff7c]/80 group-hover:text-[#F8ff7c] transition-colors"
                              >
                                {log.execution_tx_hash.slice(0, 8)}...
                                {log.execution_tx_hash.slice(-6)}
                              </a>
                            </Typography>
                            <ExternalLink className="inline w-4 h-4 align-middle group-hover:text-[#F8ff7c] transition-colors" />
                          </div>
                        ) : (
                          <Typography variant="body" color="gray" align="left">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body" color="primary" align="left">
                          {hasValidTimestamp
                            ? new Date(log.execution_timestamp).toLocaleString()
                            : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.task_status === "failed" ? (
                          <span className="border border-red-400/10 bg-red-500/10 text-red-300 py-2 px-3 rounded-full">
                            Failed
                          </span>
                        ) : log.task_status === "completed" ? (
                          <span className="border border-green-400/10 bg-green-500/10 text-green-300 py-2 px-3 rounded-full">
                            Completed
                          </span>
                        ) : (
                          <span className="border border-yellow-400/10 bg-yellow-500/10 text-yellow-300 py-2 px-3 rounded-full">
                            Processing
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="border border-[#C07AF6] bg-[#976fb93e] text-[#C07AF6]  py-1  text-center rounded-full ">
                          <Typography
                            variant="body"
                            color="blue"
                            align="center"
                          >
                            {Number(log.task_opx_cost).toFixed(6)}
                          </Typography>
                        </div>
                      </TableCell>
                      {/* Show converted_arguments cell for task_definition_id 2, 4, 6 */}
                      {(taskDefinitionId === "2" ||
                        taskDefinitionId === "4" ||
                        taskDefinitionId === "6") && (
                        <TableCell>
                          <Typography
                            variant="body"
                            color="primary"
                            align="left"
                            className="break-all"
                          >
                            {log.converted_arguments || "-"}
                          </Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* Mobile/card view */}
      <JobLogsMobileView
        logs={sortedLogs}
        error={error}
        taskDefinitionId={taskDefinitionId}
      />
    </>
  );
};

export { JobLogsMobileView };
export default JobLogsTable;
