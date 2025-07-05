"use client";

import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";
import { useJobs } from "@/hooks/useJobs";

const Statistics = () => {
  const { jobs } = useJobs();

  const totalJobs = jobs.length;
  const totalLinkedJobs = jobs.reduce(
    (total, job) => total + (job.linkedJobs?.length || 0),
    0,
  );

  return (
    <Card className="">
      <Typography variant="h2" color="white" align="left" className="mb-5">
        Statistics
      </Typography>
      <div className="space-y-4 text-gray-300">
        <div className="flex justify-start items-center gap-7">
          <Typography
            variant="badge"
            bgColor="bg-[#F8FF7C]"
            color="black"
            className="rounded-full flex items-center justify-center w-10 h-10"
          >
            {totalJobs}
          </Typography>
          <Typography variant="h4" color="gray">
            Main Jobs
          </Typography>
        </div>
        <div className="flex justify-start items-center gap-7">
          <Typography
            variant="badge"
            bgColor="bg-[#FFFFFF]"
            color="black"
            className="w-10 h-10 rounded-full flex items-center justify-center"
          >
            {totalLinkedJobs}
          </Typography>
          <Typography variant="h4" color="gray">
            Linked Jobs
          </Typography>
        </div>
      </div>
    </Card>
  );
};

export default Statistics;
