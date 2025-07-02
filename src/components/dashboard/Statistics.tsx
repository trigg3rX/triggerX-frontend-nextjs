"use client";

import { Typography } from "../ui/Typography";
import { useEffect } from "react";
import { Card } from "../ui/Card";
import { useJobs } from "@/hooks/useJobs";

const Statistics = () => {
  const { jobs, refetch } = useJobs();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const totalJobs = jobs.length;
  const totalLinkedJobs = jobs.reduce(
    (total, job) => total + (job.linkedJobs?.length || 0),
    0,
  );
  console.log("jobs", totalJobs);
  console.log("Linked jobs", totalLinkedJobs);

  return (
    <Card className="">
      <Typography variant="h3" color="white" align="left" className="mb-5">
        Statistics
      </Typography>
      <div className="space-y-4 text-gray-300">
        <div className="flex justify-start items-center gap-7">
          <Typography
            variant="badge"
            bgColor="#F8FF7C"
            color="black"
            className="py-3 px-4 "
          >
            {totalJobs}
          </Typography>
          <Typography variant="body" color="gray">
            Main Jobs
          </Typography>
        </div>
        <div className="flex justify-start items-center gap-7">
          <Typography
            variant="badge"
            bgColor="white"
            color="black"
            className="py-3 px-4 "
          >
            {totalLinkedJobs}
          </Typography>
          <Typography variant="body" color="gray">
            Linked Jobs
          </Typography>
        </div>
      </div>
    </Card>
  );
};

export default Statistics;
