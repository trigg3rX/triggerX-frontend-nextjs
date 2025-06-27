"use client";

import { useState } from "react";
import JobCard, { JobType } from "./JobCard";
import { mockLinkedJobs } from "./LinkedJobs";
import { Typography } from "../ui/Typography";
import EmptyState from "../common/EmptyState";

import DeleteDialog from "../common/DeleteDialog";

// Mock data with linked jobs imported from LinkedJobs
const mockJobs: JobType[] = [
  {
    id: 1,
    jobTitle: "Price Monitoring Job",
    taskDefinitionId: "time based",
    status: "Active",
    cost_prediction: "0.5",
    timeFrame: "1 hour",
    argType: "Simple",
    timeInterval: "5 min",
    targetContractAddress: "0x1234567890abcdef1234567890abcdef12345678",
    createdAt: "2024-03-20",
    targetFunction: "getPrice(address)",
    targetChainId: "1",
    linkedJobs: mockLinkedJobs,
  },
  {
    id: 2,
    jobTitle: "Gas Monitoring Job  ",
    taskDefinitionId: "GAS_MONITOR",
    status: "Pending",
    cost_prediction: "0.3",
    timeFrame: "30 min",
    argType: "Complex",
    timeInterval: "1 min",
    targetContractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    createdAt: "2024-03-20",
    targetFunction: "getGasPrice()",
    targetChainId: "1",
    linkedJobs: [],
  },
];

type MainJobsProps = {
  selectedType?: string;
};
const MainJobs = ({ selectedType = "All Types" }: MainJobsProps) => {
  const [expandedJobs, setExpandedJobs] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [expandedJobDetails, setExpandedJobDetails] = useState<{
    [key: number]: boolean;
  }>({});
  const [expandedLinkedJobDetails, setExpandedLinkedJobDetails] = useState<{
    [key: number]: boolean;
  }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState<number | null>(null);

  const toggleJobExpand = (jobId: number) => {
    setExpandedJobs((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const toggleJobDetails = (jobId: number) => {
    setExpandedJobDetails((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const toggleLinkedJobDetails = (jobId: number) => {
    setExpandedLinkedJobDetails((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const showDeleteConfirmation = (jobId: number) => {
    setJobIdToDelete(jobId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    // TODO: Replace with actual delete logic
    console.log("Confirmed delete job:", jobIdToDelete);
    setDeleteDialogOpen(false);
    setJobIdToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setJobIdToDelete(null);
  };

  const getFilteredJobs = () => {
    if (!selectedType || selectedType === "All Types") return mockJobs;
    if (selectedType === "Time-based") {
      return mockJobs.filter((job) => job.taskDefinitionId === "TIME_BASED");
    }
    if (selectedType === "Event-based") {
      return mockJobs.filter((job) => job.taskDefinitionId === "EVENT_BASED");
    }
    if (selectedType === "Condition-based") {
      return mockJobs.filter(
        (job) => job.taskDefinitionId === "CONDITION_BASED",
      );
    }
    return mockJobs;
  };

  const getPaginatedData = (jobs: JobType[]) => {
    return jobs;
  };

  // Map selectedType to allowed JobTypeTab values
  const mapToJobTypeTab = (
    type: string,
  ): "All Types" | "Time-based" | "Event-based" | "Condition-based" => {
    if (
      type === "Time-based" ||
      type === "Event-based" ||
      type === "Condition-based"
    )
      return type;
    return "All Types";
  };

  return (
    <>
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Job"
        description="Are you sure you want to delete this job? This action cannot be undone."
        onCancel={handleCancelDelete}
        onConfirm={handleDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 xl:grid-cols-3">
        {getPaginatedData(getFilteredJobs()).length === 0 ? (
          <EmptyState type="keeper" jobType={mapToJobTypeTab(selectedType)} />
        ) : (
          getPaginatedData(getFilteredJobs()).map((job) => (
            <div key={job.id} className="col-span-1">
              <JobCard
                job={job}
                expanded={!!expandedJobs[job.id]}
                expandedDetails={!!expandedJobDetails[job.id]}
                onToggleExpand={toggleJobExpand}
                onToggleDetails={toggleJobDetails}
                onDelete={showDeleteConfirmation}
              />
            </div>
          ))
        )}
      </div>
      <div>
        {getPaginatedData(getFilteredJobs()).map((job) =>
          job.linkedJobs &&
          job.linkedJobs.length > 0 &&
          expandedJobs[job.id] ? (
            <div key={job.id}>
              <Typography
                variant="h2"
                color="white"
                align="left"
                className=" font-semibold my-7"
              >
                Linked Jobs
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 xl:grid-cols-3">
                {job.linkedJobs.map((linkedJob) => (
                  <JobCard
                    key={linkedJob.id}
                    job={linkedJob}
                    expanded={false}
                    expandedDetails={!!expandedLinkedJobDetails[linkedJob.id]}
                    onToggleExpand={() => {}}
                    onToggleDetails={toggleLinkedJobDetails}
                    onDelete={showDeleteConfirmation}
                  />
                ))}
              </div>
            </div>
          ) : null,
        )}
      </div>
    </>
  );
};

export default MainJobs;
