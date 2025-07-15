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
            <Card key={log.id} className="mb-2">
              <div className="flex flex-col gap-2 ">
                <div className="flex justify-between  py-1">
                  <Typography variant="body" color="primary">
                    Id
                  </Typography>
                  <Typography color="gray">{log.id}</Typography>
                </div>
                <div className="flex justify-between  py-1">
                  <Typography color="primary" variant="body">
                    Timestamp
                  </Typography>
                  <Typography color="gray">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString()
                      : "-"}
                  </Typography>
                </div>
                <div className="flex justify-between  py-1">
                  <Typography color="primary" variant="body">
                    Status
                  </Typography>
                  <Typography color="gray">
                    {" "}
                    {log.success ? (
                      <span className="text-green-400">Success</span>
                    ) : (
                      <span className="text-red-400">Fail</span>
                    )}
                  </Typography>
                </div>
                <div className="flex justify-between   py-1">
                  <Typography color="primary" variant="body">
                    TG Used
                  </Typography>
                  <Typography color="gray">{log.tgUsed}</Typography>
                </div>
                <div className="flex justify-between  py-1">
                  <Typography color="primary" variant="body">
                    Tx Hash
                  </Typography>
                  <Typography color="gray">
                    {" "}
                    {log.txHash ? (
                      <a
                        href={`https://etherscan.io/tx/${log.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-400"
                      >
                        {log.txHash.slice(0, 8)}...{log.txHash.slice(-6)}
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
              <TableHead>Id</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>TG Used</TableHead>
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
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {log.success ? (
                      <span className="text-green-400">Success</span>
                    ) : (
                      <span className="text-red-400">Fail</span>
                    )}
                  </TableCell>
                  <TableCell>{log.tgUsed}</TableCell>
                  <TableCell>
                    {log.txHash ? (
                      <a
                        href={`https://etherscan.io/tx/${log.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-400"
                      >
                        {log.txHash.slice(0, 8)}...{log.txHash.slice(-6)}
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
