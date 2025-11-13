"use client";

import { Typography } from "@/components/ui/Typography";
import { Dropdown, DropdownOption } from "@/components/ui/Dropdown";
import { useEffect, useState } from "react";
import MainJobs from "@/components/dashboard/MainJobs";
import { Card } from "@/components/ui/Card";
import { useSafeJobs } from "@/hooks/useSafeJobs";
import { JobType } from "@/hooks/useJobs";
import React from "react";
import { useChainId } from "wagmi";
import networksData from "@/utils/networks.json";

const dropdownOptions: DropdownOption[] = [
  { id: "all", name: "All Types" },
  { id: "time", name: "Time-based" },
  { id: "event", name: "Event-based" },
  { id: "condition", name: "Condition-based" },
];

type SafeJobsProps = {
  selectedSafe: string | null;
};

const SafeJobs: React.FC<SafeJobsProps> = ({ selectedSafe }) => {
  const [selectedType, setSelectedType] = useState<string>("All Types");
  const { jobs: fetchedJobs, loading } = useSafeJobs(selectedSafe);
  const [jobs, setJobs] = useState<JobType[]>([]);
  const chainId = useChainId();

  // Update jobs when fetched jobs change
  useEffect(() => {
    setJobs(fetchedJobs);
  }, [fetchedJobs]);

  // Aggregate counts for header badges
  const totalJobs = jobs.length;
  const totalLinkedJobs = jobs.reduce(
    (total, job) => total + (job.linkedJobs?.length || 0),
    0,
  );

  // Show message when no safe is selected
  if (!selectedSafe) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Typography variant="h3" color="gray" align="center">
            Select a Safe wallet to view its jobs
          </Typography>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-6 flex-col lg:flex-row gap-6 md:flex-row">
        <div className="flex justify-between items-start gap-6 flex-col sm:flex-row w-full md:w-[300px]">
          <div className="flex justify-start items-center gap-2">
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
      <div className="mb-10">
        {/* Reuse MainJobs presentational component */}
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

export default SafeJobs;
