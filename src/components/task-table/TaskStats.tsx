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

interface StatItem {
  label: string;
  value: number;
}

const StatCard: React.FC<StatItem> = ({ label, value }) => {
  return (
    <Card className="!p-4 bg-[#1a1a1a]">
      <Typography variant="body" color="gray" className="mb-2">
        {label}
      </Typography>
      <Typography
        variant="body"
        color="primary"
        className="font-bold tracking-wide text-xl"
      >
        {value.toLocaleString()}
      </Typography>
    </Card>
  );
};

const TaskStats: React.FC<TaskStatsProps> = ({
  totalTasks,
  totalUsers,
  totalKeepers,
  totalJobs,
}) => {
  const stats: StatItem[] = [
    { label: "Total Tasks (Transactions)", value: totalTasks },
    { label: "Total Users", value: totalUsers },
    { label: "Total Keepers", value: totalKeepers },
    { label: "Total Jobs", value: totalJobs },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-0">
      {stats.map((stat, index) => (
        <StatCard key={index} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
};

export default TaskStats;
