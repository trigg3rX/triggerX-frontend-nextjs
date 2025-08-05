import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../leaderboard/Table";
import type { JobLog } from "@/hooks/useJobLogs";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";

interface JobLogsTableProps {
  logs: JobLog[];
  error?: string;
}

// Mobile card view for job logs
const JobLogsMobileView: React.FC<JobLogsTableProps> = ({ logs, error }) => {
  return (
    <div className="md:hidden w-full">
      <Typography variant="h2" color="white" align="left" className="mt-7 mb-4">
        Job Logs
      </Typography>
      {error ? (
        <Card className="mb-4">
          <Typography color="error">{error}</Typography>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="mb-4">
          <Typography>No logs found.</Typography>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {logs.map((log) => (
            <Card key={`${log.task_id}-${log.task_number}`} className="mb-2">
              <div className="flex flex-col gap-2 ">
                <div className="flex justify-between  py-1">
                  <Typography variant="body" color="primary">
                    Task ID
                  </Typography>
                  <Typography color="gray">{log.task_id}</Typography>
                </div>
                <div className="flex justify-between  py-1">
                  <Typography variant="body" color="primary">
                    Task Number
                  </Typography>
                  <Typography color="gray">{log.task_number}</Typography>
                </div>
                <div className="flex justify-between  py-1">
                  <Typography color="primary" variant="body">
                    Timestamp
                  </Typography>
                  <Typography color="gray">
                    {log.execution_timestamp &&
                    log.execution_timestamp !== "0001-01-01T00:00:00Z"
                      ? new Date(log.execution_timestamp).toLocaleString()
                      : "-"}
                  </Typography>
                </div>
                <div className="flex justify-between  py-1">
                  <Typography color="primary" variant="body">
                    Status
                  </Typography>
                  <Typography color="gray">
                    {" "}
                    {log.is_successful ? (
                      <span className="text-green-400">Success</span>
                    ) : (
                      <span className="text-red-400">Failed</span>
                    )}
                  </Typography>
                </div>
                <div className="flex justify-between   py-1">
                  <Typography color="primary" variant="body">
                    OPX Cost
                  </Typography>
                  <Typography color="gray">{log.task_opx_cost}</Typography>
                </div>
                <div className="flex justify-between  py-1">
                  <Typography color="primary" variant="body">
                    Tx Hash
                  </Typography>
                  <Typography color="gray">
                    {" "}
                    {log.execution_tx_hash ? (
                      <a
                        href={`https://etherscan.io/tx/${log.execution_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-400"
                      >
                        {log.execution_tx_hash.slice(0, 8)}...
                        {log.execution_tx_hash.slice(-6)}
                      </a>
                    ) : (
                      <span>-</span>
                    )}
                  </Typography>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const JobLogsTable: React.FC<JobLogsTableProps> = ({ logs, error }) => {
  return (
    <>
      {/* Desktop/tablet view */}
      <div className="hidden md:block w-full overflow-x-auto">
        <Typography
          variant="h2"
          color="white"
          align="left"
          className=" mt-7 mb-4"
        >
          Job Logs
        </Typography>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task ID</TableHead>
              <TableHead>Task #</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>OPX Cost</TableHead>
              <TableHead>Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-red-400">
                  {error}
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={`${log.task_id}-${log.task_number}`}>
                  <TableCell>{log.task_id}</TableCell>
                  <TableCell>{log.task_number}</TableCell>
                  <TableCell>
                    {log.execution_timestamp &&
                    log.execution_timestamp !== "0001-01-01T00:00:00Z"
                      ? new Date(log.execution_timestamp).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {log.is_successful ? (
                      <span className="text-green-400">Success</span>
                    ) : (
                      <span className="text-red-400">Failed</span>
                    )}
                    {log.task_status && (
                      <span className="ml-2 text-gray-400">
                        ({log.task_status})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{log.task_opx_cost}</TableCell>
                  <TableCell>
                    {log.execution_tx_hash ? (
                      <a
                        href={`https://etherscan.io/tx/${log.execution_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-400"
                      >
                        {log.execution_tx_hash.slice(0, 8)}...
                        {log.execution_tx_hash.slice(-6)}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Mobile/card view */}
      <JobLogsMobileView logs={logs} error={error} />
    </>
  );
};

export { JobLogsMobileView };
export default JobLogsTable;
