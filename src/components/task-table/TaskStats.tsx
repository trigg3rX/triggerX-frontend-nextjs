"use client";

import React from "react";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";

interface TaskStatsProps {
  totalTasks: number;
  totalUsers: number;
  totalKeepers: number;
  totalJobs: number;
}

const TaskStats: React.FC<TaskStatsProps> = ({
  totalTasks,
  totalUsers,
  totalKeepers,
  totalJobs,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-0">
      <Card className="!p-4 bg-[#1a1a1a]">
        <Typography variant="body" color="gray" className="mb-2">
          Total Tasks (Transactions)
        </Typography>
        <Typography
          variant="body"
          color="primary"
          className="font-bold tracking-wide text-xl"
        >
          {totalTasks.toLocaleString()}
        </Typography>
      </Card>

      <Card className="!p-4 bg-[#1a1a1a]">
        <Typography variant="body" color="gray" className="mb-2">
          Total Users
        </Typography>
        <Typography
          variant="body"
          color="primary"
          className="font-bold tracking-wide text-xl"
        >
          {totalUsers.toLocaleString()}
        </Typography>
      </Card>

      <Card className="!p-4 bg-[#1a1a1a]">
        <Typography variant="body" color="gray" className="mb-2">
          Total Keepers
        </Typography>
        <Typography
          variant="body"
          color="primary"
          className="font-bold tracking-wide text-xl"
        >
          {totalKeepers.toLocaleString()}
        </Typography>
      </Card>

      <Card className="!p-4 bg-[#1a1a1a]">
        <Typography variant="body" color="gray" className="mb-2">
          Total Jobs
        </Typography>
        <Typography
          variant="body"
          color="primary"
          className="font-bold tracking-wide text-xl"
        >
          {totalJobs.toLocaleString()}
        </Typography>
      </Card>
    </div>
  );
};

export default TaskStats;
