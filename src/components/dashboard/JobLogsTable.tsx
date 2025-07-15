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

interface JobLogsTableProps {
  logs: JobLog[];
  error?: string;
}

const JobLogsTable: React.FC<JobLogsTableProps> = ({ logs, error }) => {
  return (
    <div className="w-full overflow-x-auto">
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
  );
};

export default JobLogsTable;
