import { useState } from "react";
import JobCard, { JobType } from "./JobCard";

import DeleteDialog from "../common/DeleteDialog";

// Mock data for linked jobs
export const mockLinkedJobs: JobType[] = [
  {
    id: 101,
    jobTitle: "Linked Price Monitor",
    taskDefinitionId: "PRICE_MONITOR",
    status: "Active",
    cost_prediction: "0.2",
    timeFrame: "2 hours",
    argType: "Simple",
    timeInterval: "10 minutes",
    targetContractAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    createdAt: "2024-03-21T12:00:00Z",
    targetFunction: "getPrice(address)",
    targetChainId: "1",
    linkedJobs: [],
  },
  {
    id: 102,
    jobTitle: "Linked Gas Monitor",
    taskDefinitionId: "GAS_MONITOR",
    status: "Paused",
    cost_prediction: "0.1",
    timeFrame: "45 minutes",
    argType: "Complex",
    timeInterval: "2 minutes",
    targetContractAddress: "0x1234123412341234123412341234123412341234",
    createdAt: "2024-03-21T13:00:00Z",
    targetFunction: "getGasPrice()",
    targetChainId: "1",
    linkedJobs: [],
  },
];

const LinkedJobs = () => {
  const [expandedJobs, setExpandedJobs] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [expandedJobDetails, setExpandedJobDetails] = useState<{
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

  const showDeleteConfirmation = (jobId: number) => {
    setJobIdToDelete(jobId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    // TODO: Replace with actual delete logic
    console.log("Confirmed delete linked job:", jobIdToDelete);
    setDeleteDialogOpen(false);
    setJobIdToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setJobIdToDelete(null);
  };

  return (
    <>
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Linked Job"
        description="Are you sure you want to delete this linked job? This action cannot be undone."
        onCancel={handleCancelDelete}
        onConfirm={handleDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
      {mockLinkedJobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          expanded={!!expandedJobs[job.id]}
          expandedDetails={!!expandedJobDetails[job.id]}
          onToggleExpand={toggleJobExpand}
          onToggleDetails={toggleJobDetails}
          onDelete={showDeleteConfirmation}
        />
      ))}
    </>
  );
};

export default LinkedJobs;
