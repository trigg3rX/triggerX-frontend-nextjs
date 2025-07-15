"use client";

import { useState, useRef, useEffect } from "react";
import JobCard from "./JobCard";
import { Typography } from "../ui/Typography";
import EmptyState from "../common/EmptyState";
import DeleteDialog from "../common/DeleteDialog";
import { JobType } from "@/hooks/useJobs";
import JobCardSkeleton from "../skeleton/JobCardSkeleton";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import { WalletConnectionCard } from "../common/WalletConnectionCard";
import { useDeleteJob } from "@/hooks/useDeleteJob";
import { ErrorMessage } from "../common/ErrorMessage";
import JobLogsTable from "./JobLogsTable";
import { useJobLogs } from "@/hooks/useJobLogs";

type MainJobsProps = {
  selectedType?: string;
  jobs: JobType[];
  setJobs: React.Dispatch<React.SetStateAction<JobType[]>>;
};
const MainJobs = ({
  selectedType = "All Types",
  jobs,
  setJobs,
}: MainJobsProps) => {
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
  const [jobLogsOpenId, setJobLogsOpenId] = useState<number | null>(null);

  // Refs for Linked Jobs sections and Job Logs section
  const linkedJobsRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const logsRef = useRef<HTMLDivElement | null>(null);

  const { loading, error } = { loading: false, error: null };
  const { isConnected } = useWalletConnectionContext();
  const { deleteJob, loading: deleteLoading } = useDeleteJob();
  const {
    logs: jobLogs,
    loading: logsLoading,
    error: logsError,
  } = useJobLogs(jobLogsOpenId ?? undefined);

  useEffect(() => {
    // setJobs(fetchedJobs); // This line is removed as per the edit hint
  }, [jobs]); // Changed dependency to 'jobs'

  const toggleJobExpand = (jobId: number) => {
    setExpandedJobs((prev) => {
      const newState = { ...prev, [jobId]: !prev[jobId] };
      // Only scroll when expanding (not collapsing)
      if (!prev[jobId]) {
        setTimeout(() => {
          if (linkedJobsRefs.current[jobId]) {
            const headerOffset = 200;
            const elementPosition =
              linkedJobsRefs.current[jobId]!.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }, 500);
      }
      // Close all expanded job details when a linked job is expanded
      setExpandedJobDetails({});
      // Close job logs if open
      setJobLogsOpenId(null);
      return newState;
    });
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

  const handleDelete = async () => {
    if (jobIdToDelete == null) return;
    await deleteJob(jobIdToDelete);
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobIdToDelete));
    setDeleteDialogOpen(false);
    setJobIdToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setJobIdToDelete(null);
  };

  const handleJobCardClick = (jobId: number) => {
    setExpandedJobs({}); // Close all linked jobs
    setJobLogsOpenId((prev) => {
      const newId = prev === jobId ? null : jobId;
      // Only scroll when opening logs (not closing)
      if (newId !== null) {
        setTimeout(() => {
          if (logsRef.current) {
            const headerOffset = 100;
            const elementPosition = logsRef.current.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }, 500);
      }
      return newId;
    });
  };

  const getFilteredJobs = () => {
    if (selectedType !== "All Types") {
      return jobs.filter((job) => job.taskDefinitionId === selectedType);
    }
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
        confirmText={deleteLoading ? "Deleting..." : "Delete"}
        cancelText="Cancel"
      />

      {loading ? (
        <div className="text-white text-center py-10">
          <JobCardSkeleton />
        </div>
      ) : !isConnected ? (
        <WalletConnectionCard className="border-0" />
      ) : (
        <>
          {getFilteredJobs().length === 0 && !error && (
            <EmptyState
              jobType={mapToJobTypeTab(selectedType)}
              type="All Types"
            />
          )}

          {error && <ErrorMessage error={error} />}

          {!error && getFilteredJobs().length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 xl:grid-cols-3">
              {getFilteredJobs().map((job) => (
                <div
                  key={job.id}
                  className="col-span-1"
                  onClick={() => handleJobCardClick(job.id)}
                  style={{ cursor: "pointer" }}
                  ref={(el) => {
                    linkedJobsRefs.current[job.id] = el;
                  }}
                >
                  <JobCard
                    job={job}
                    expanded={!!expandedJobs[job.id]}
                    expandedDetails={!!expandedJobDetails[job.id]}
                    onToggleExpand={toggleJobExpand}
                    onToggleDetails={toggleJobDetails}
                    onDelete={showDeleteConfirmation}
                    isLogOpen={jobLogsOpenId === job.id}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {/* JobLogsTable outside the grid, full width */}
      {jobLogsOpenId !== null && (
        <div ref={logsRef}>
          {logsLoading ? (
            <div className="text-white text-center py-4">Loading logs...</div>
          ) : logsError ? (
            <JobLogsTable logs={[]} error={logsError} />
          ) : (
            <>
              <JobLogsTable logs={jobLogs} />
            </>
          )}
        </div>
      )}
      <div>
        {getFilteredJobs().map((job) =>
          job.linkedJobs &&
          job.linkedJobs.length > 0 &&
          expandedJobs[job.id] ? (
            <div
              key={job.id}
              ref={(el) => {
                linkedJobsRefs.current[job.id] = el;
              }}
            >
              <Typography
                variant="h2"
                color="white"
                align="left"
                className=" my-7"
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
