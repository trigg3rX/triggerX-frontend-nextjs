"use client";

import { Typography } from "../ui/Typography";
import { Dropdown, DropdownOption } from "../ui/Dropdown";
import { useState } from "react";
import MainJobs from "./MainJobs";
import { Card } from "../ui/Card";
import { useJobs, JobType } from "@/hooks/useJobs";
import React from "react";

const dropdownOptions: DropdownOption[] = [
  { id: "all", name: "All Types" },
  { id: "time", name: "Time-based" },
  { id: "event", name: "Event-based" },
  { id: "condition", name: "Condition-based" },
];

const ActiveJobs = () => {
  const [selectedType, setSelectedType] = useState<string>("All Types");
  const { jobs: fetchedJobs } = useJobs();
  const [jobs, setJobs] = useState<JobType[]>([]);
  // Sync local jobs state with fetched jobs
  React.useEffect(() => {
    setJobs(fetchedJobs);
  }, [fetchedJobs]);

  const totalJobs = jobs.length;
  const totalLinkedJobs = jobs.reduce(
    (total, job) => total + (job.linkedJobs?.length || 0),
    0,
  );

  return (
    <Card>
      <div className="flex justify-between items-center mb-6 flex-col lg:flex-row gap-6 md:flex-row">
        <div className="flex justify-between items-start gap-6 flex-row lg:flex-row  w-full md:w-[300px]   md:flex-row">
          <div className="flex justify-start items-center gap-2 ">
            <Typography
              variant="badge"
              bgColor="bg-[#F8FF7C]"
              color="black"
              className="rounded-full flex items-center justify-center w-8 h-8"
            >
              {totalJobs}
            </Typography>
            <Typography variant="h4" color="gray">
              Main Jobs
            </Typography>
          </div>
          <div className="flex justify-start items-center gap-2">
            <Typography
              variant="badge"
              bgColor="bg-[#FFFFFF]"
              color="black"
              className="rounded-full flex items-center justify-center w-8 h-8"
            >
              {totalLinkedJobs}
            </Typography>
            <Typography variant="h4" color="gray">
              Linked Jobs
            </Typography>
          </div>
        </div>
        <div className=" w-56">
          <Dropdown
            label=""
            options={dropdownOptions}
            selectedOption={selectedType}
            onChange={(option) => setSelectedType(option.name)}
            className="gap-0 !w-full"
          />
        </div>
      </div>
      <div className="mb-10">
        <MainJobs selectedType={selectedType} jobs={jobs} setJobs={setJobs} />
      </div>
    </Card>
  );
};

export default ActiveJobs;
