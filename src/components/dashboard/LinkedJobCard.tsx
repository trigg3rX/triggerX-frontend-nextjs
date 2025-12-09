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
            Job Status :
          </Typography>
          <Typography
            variant="body"
            color="gray"
            align="right"
            className={`${job.is_active ? "text-[#4caf50]" : "text-[#ff4444]"}`}
          >
            {job.is_active ? "Running" : "Completed"}
          </Typography>
        </div>
        <div className="flex items-center justify-between">
          <Typography variant="body" color="gray">
            ETH Used:
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
