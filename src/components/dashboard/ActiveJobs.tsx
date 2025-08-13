"use client";
import { Typography } from "../ui/Typography";
import { Dropdown, DropdownOption } from "../ui/Dropdown";
import { useState } from "react";
import MainJobs from "./MainJobs";
import { Card } from "../ui/Card";
import { useJobs, JobType } from "@/hooks/useJobs";
import React from "react";
import { useChainId } from "wagmi";
import networksData from "@/utils/networks.json";

const dropdownOptions: DropdownOption[] = [
  { id: "all", name: "All Types" },
  { id: "time", name: "Time-based" },
  { id: "event", name: "Event-based" },
  { id: "condition", name: "Condition-based" },
];

const ActiveJobs = () => {
  const [selectedType, setSelectedType] = useState<string>("All Types");
  const { jobs: fetchedJobs, loading } = useJobs();
  const [jobs, setJobs] = useState<JobType[]>([]);
  const chainId = useChainId();

  // Sync local jobs state with fetched jobs
  React.useEffect(() => {
    const currentChainId = Number(chainId);
    const filtered = fetchedJobs.filter((job) => {
      const createdId = Number(job.created_chain_id);
      return !Number.isNaN(createdId) && createdId === currentChainId;
    });
    setJobs(filtered);
  }, [fetchedJobs, chainId]);

  const totalJobs = jobs.length;
  const totalLinkedJobs = jobs.reduce(
    (total, job) => total + (job.linkedJobs?.length || 0),
    0,
  );

  return (
    <Card>
      <div className="flex justify-between items-center mb-6 flex-col lg:flex-row gap-6 md:flex-row">
        <div className="flex justify-between items-start gap-6 flex-col sm:flex-row  w-full md:w-[300px]  ">
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
        <div className="w-full md:w-56">
          <Dropdown
            label=""
            options={dropdownOptions}
            selectedOption={selectedType}
            onChange={(option) => setSelectedType(option.name)}
            className="gap-0 w-full md:w-full"
          />
        </div>
      </div>
      <div className={`mb-10   `}>
        <MainJobs
          selectedType={selectedType}
          jobs={jobs}
          setJobs={setJobs}
          loading={loading}
          chainName={
            networksData.supportedNetworks.find((n) => n.id === Number(chainId))
              ?.name
          }
        />
      </div>
    </Card>
  );
};

export default ActiveJobs;
