"use client";

import React from "react";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";
import { JobType } from "@/hooks/useJobs";

interface LinkedJobCardProps {
  job: JobType;
  onClick: (jobId: number) => void;
}

const LinkedJobCard: React.FC<LinkedJobCardProps> = ({ job, onClick }) => {
  return (
    <Card
      className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-[#D9D9D924] hover:to-[#14131324] hover:border hover:border-white transition-all duration-300"
      onClick={() => onClick(job.id)}
    >
      <div className="space-y-2">
        <Typography variant="h5" color="primary" className="truncate">
          {job.jobTitle}
        </Typography>
        <div className="flex items-center justify-between">
          <Typography variant="body" color="gray">
            Status:
          </Typography>
          <Typography
            variant="body"
            color={job.is_active ? "success" : "error"}
          >
            {job.is_active ? "Active" : "Inactive"}
          </Typography>
        </div>
        <div className="flex items-center justify-between">
          <Typography variant="body" color="gray">
            TG Used:
          </Typography>
          <Typography variant="body" color="primary">
            {isNaN(parseFloat(job.job_cost_actual))
              ? "N/A"
              : parseFloat(job.job_cost_actual).toFixed(2)}
          </Typography>
        </div>
        <div className="flex items-center justify-between">
          <Typography variant="body" color="gray">
            Type:
          </Typography>
          <Typography variant="body" color="primary">
            {job.taskDefinitionId}
          </Typography>
        </div>
      </div>
    </Card>
  );
};

export default LinkedJobCard;
