"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../leaderboard/Table";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";
import { ExternalLink, ChevronDownIcon } from "lucide-react";
import scrollbarStyles from "@/app/styles/scrollbar.module.css";

export interface TaskData {
  id: string;
  taskNumber: number;
  txHash: string;
  txUrl?: string;
  timestamp: string;
  status: "completed" | "failed" | "processing";
  operationCost: number;
}

interface TaskTableProps {
  tasks: TaskData[];
  error?: string;
}

/** Mobile-friendly card view of tasks */
const TaskMobileView: React.FC<TaskTableProps> = ({ tasks, error }) => {
  const shouldScroll = tasks.length > 10;

  return (
    <div className="xl:hidden w-full">
      <div
        className={`grid grid-cols-1 gap-4 ${shouldScroll ? `max-h-[600px] overflow-y-auto ${scrollbarStyles.customScrollbar}` : ""}`}
        style={shouldScroll ? { maxHeight: 600 } : {}}
      >
        {error ? (
          <Card className="mb-4">
            <Typography className="text-center text-red-400">
              {error}
            </Typography>
          </Card>
        ) : tasks.length === 0 ? (
          <Card className="mb-4">
            <Typography className="text-center text-gray-400">
              No tasks found.
            </Typography>
          </Card>
        ) : (
          tasks.map((task) => {
            const hasValidTimestamp =
              !!task.timestamp && task.timestamp !== "0001-01-01T00:00:00Z";

            return (
              <Card key={task.id} className="mb-2">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between py-1">
                    <Typography variant="body" color="primary" align="left">
                      Task Number
                    </Typography>
                    <Typography color="gray">{task.taskNumber}</Typography>
                  </div>
                  <div className="flex justify-between py-1">
                    <Typography color="primary" variant="body" align="left">
                      Timestamp
                    </Typography>
                    <Typography color="gray">
                      {hasValidTimestamp
                        ? new Date(task.timestamp).toLocaleString()
                        : "-"}
                    </Typography>
                  </div>
                  <div className="flex justify-between py-1">
                    <Typography color="primary" variant="body" align="left">
                      Status
                    </Typography>
                    <Typography color="gray">
                      {task.status === "failed" ? (
                        <span className="text-red-400">Failed</span>
                      ) : task.status === "completed" ? (
                        <span className="text-green-400">Completed</span>
                      ) : (
                        <span className="text-yellow-400">Processing</span>
                      )}
                    </Typography>
                  </div>
                  <div className="flex justify-between py-1">
                    <Typography color="primary" variant="body" align="left">
                      Operation Cost
                    </Typography>
                    <Typography color="gray">{task.operationCost}</Typography>
                  </div>
                  <div className="flex justify-between py-1">
                    <Typography color="primary" variant="body" align="left">
                      Tx Hash
                    </Typography>
                    <Typography color="gray">
                      {task.txUrl && task.txHash ? (
                        <a
                          href={
                            task.txUrl?.match(/^https?:\/\//)
                              ? task.txUrl
                              : `https://${task.txUrl.replace(/^\/+/, "")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-[#F8ff7c]/80"
                        >
                          {task.txHash.slice(0, 8)}...
                          {task.txHash.slice(-6)}
                        </a>
                      ) : (
                        <span>-</span>
                      )}
                    </Typography>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

const TaskTable: React.FC<TaskTableProps> = ({ tasks, error }) => {
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "desc",
  );

  const sortedTasks = React.useMemo(() => {
    const isValidTimestamp = (ts?: string) =>
      !!ts && ts !== "0001-01-01T00:00:00Z";

    return [...tasks].sort((a, b) => {
      const aValid = isValidTimestamp(a.timestamp);
      const bValid = isValidTimestamp(b.timestamp);

      if (aValid && bValid) {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        if (bTime !== aTime)
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
        // tie-breaker on task number
        return sortDirection === "asc"
          ? a.taskNumber - b.taskNumber
          : b.taskNumber - a.taskNumber;
      }
      if (aValid && !bValid) return -1;
      if (!aValid && bValid) return 1;
      // both invalid -> fall back to task number
      return sortDirection === "asc"
        ? a.taskNumber - b.taskNumber
        : b.taskNumber - a.taskNumber;
    });
  }, [tasks, sortDirection]);

  const shouldScroll = sortedTasks.length > 10;

  return (
    <>
      {/* Desktop/tablet view */}
      <div className="hidden xl:block w-full">
        <Card className="p-6 relative z-0">
          <div
            className={`overflow-auto ${shouldScroll ? `max-h-[500px] ${scrollbarStyles.customScrollbar}` : ""}`}
            style={shouldScroll ? { maxHeight: 500 } : {}}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#1A1A1A] border-b border-[#2A2A2A]">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-red-400">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTasks.map((task) => {
                    const hasValidTimestamp =
                      !!task.timestamp &&
                      task.timestamp !== "0001-01-01T00:00:00Z";

                    return (
                      <TableRow key={task.id} className="group">
                        <TableCell
                          className={`border-l-4 px-6 py-4 ${
                            task.status === "completed"
                              ? "border-green-500"
                              : task.status === "failed"
                                ? "border-red-500"
                                : "border-yellow-500"
                          }`}
                        >
                          <Typography
                            variant="body"
                            color="primary"
                            align="left"
                          >
                            {task.taskNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {task.txUrl && task.txHash ? (
                            <div className="flex items-center gap-2">
                              <Typography
                                variant="body"
                                color="primary"
                                align="left"
                              >
                                <a
                                  href={
                                    task.txUrl?.match(/^https?:\/\//)
                                      ? task.txUrl
                                      : `https://${task.txUrl.replace(/^\/+/, "")}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline-offset-2 pt-1 hover:text-[#F8ff7c]/80 group-hover:text-[#F8ff7c] transition-colors"
                                >
                                  {task.txHash.slice(0, 8)}...
                                  {task.txHash.slice(-6)}
                                </a>
                              </Typography>
                              <ExternalLink className="inline w-4 h-4 align-middle group-hover:text-[#F8ff7c] transition-colors" />
                            </div>
                          ) : (
                            <Typography
                              variant="body"
                              color="gray"
                              align="left"
                            >
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body"
                            color="primary"
                            align="left"
                          >
                            {hasValidTimestamp
                              ? new Date(task.timestamp).toLocaleString()
                              : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {task.status === "failed" ? (
                            <span className="border border-red-400/10 bg-red-500/10 text-red-300 py-2 px-3 rounded-full">
                              Failed
                            </span>
                          ) : task.status === "completed" ? (
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
                          <div className="border border-[#C07AF6] bg-[#976fb93e] text-[#C07AF6] py-1 text-center rounded-full">
                            <Typography
                              variant="body"
                              color="blue"
                              align="center"
                            >
                              {Number(task.operationCost).toFixed(6)}
                            </Typography>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
      {/* Mobile/card view */}
      <TaskMobileView tasks={sortedTasks} error={error} />
    </>
  );
};

export { TaskMobileView };
export default TaskTable;
