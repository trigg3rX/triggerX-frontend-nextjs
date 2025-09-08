"use client";

import { useState, useRef, useEffect } from "react";
import JobCard from "./JobCard";
import JobDetailsView from "./JobDetailsView";
import { Typography } from "../ui/Typography";
import EmptyState from "../common/EmptyState";
import DeleteDialog from "../common/DeleteDialog";
import { JobType } from "@/hooks/useJobs";
import JobCardSkeleton from "../skeleton/JobCardSkeleton";
import JobLogsSkeleton from "./JobLogsSkeleton";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import { WalletConnectionCard } from "../common/WalletConnectionCard";
import { useDeleteJob } from "@/hooks/useDeleteJob";
import { ErrorMessage } from "../common/ErrorMessage";
import JobLogsTable from "./JobLogsTable";
import { useJobLogsHybrid } from "@/hooks/useJobLogsHybrid";
import styles from "@/app/styles/scrollbar.module.css";
import { Pagination } from "../ui/Pagination";

type MainJobsProps = {
  selectedType?: string;
  jobs: JobType[];
  setJobs: React.Dispatch<React.SetStateAction<JobType[]>>;
  loading?: boolean;
  chainName?: string;
};

const MainJobs = ({
  selectedType = "All Types",
  jobs,
  setJobs,
  loading = false,
  chainName,
}: MainJobsProps) => {
  const [expandedJobs, setExpandedJobs] = useState<{ [key: number]: boolean }>(
    {},
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState<number | null>(null);
  const [jobLogsOpenId, setJobLogsOpenId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage, setJobsPerPage] = useState(6); // Allow dynamic change
  const [groupSize, setGroupSize] = useState(2); // Add state for group size
  const [selectedJob, setSelectedJob] = useState<JobType | null>(null);

  // Refs for Linked Jobs sections and Job Logs section
  const linkedJobsRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const logsRef = useRef<HTMLDivElement | null>(null);

  const { error } = { error: null };
  const { isConnected: walletConnected } = useWalletConnectionContext();
  const { deleteJob, loading: deleteLoading } = useDeleteJob();
  const {
    logs: jobLogs,
    loading: logsLoading,
    error: logsError,
    isConnected,
    isConnecting,
    useWebSocketMode,
  } = useJobLogsHybrid(jobLogsOpenId ?? undefined);

  // Add resize effect to update group size
  useEffect(() => {
    const updateGroupSize = () => {
      const newGroupSize = window.innerWidth >= 1280 ? 3 : 2;
      setGroupSize(newGroupSize);
    };

    // Set initial group size
    updateGroupSize();

    // Add resize listener
    window.addEventListener("resize", updateGroupSize);

    // Cleanup
    return () => window.removeEventListener("resize", updateGroupSize);
  }, []);

  useEffect(() => {
    // setJobs(fetchedJobs); // This line is removed as per the edit hint
  }, [jobs]); // Changed dependency to 'jobs'

  // Close all expanded states and logs when filter changes
  useEffect(() => {
    setExpandedJobs({});
    setJobLogsOpenId(null);
    setSelectedJob(null); // Reset selected job when filter changes
  }, [selectedType]);

  // Reset page to 1 when selectedType changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedJob(null); // Reset selected job when page changes
  }, [selectedType, jobsPerPage]);

  const handleDelete = async () => {
    if (jobIdToDelete == null) return;
    await deleteJob(jobIdToDelete);
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobIdToDelete));
    // Clear job logs if the deleted job is currently showing logs
    if (jobLogsOpenId === jobIdToDelete) {
      setJobLogsOpenId(null);
    }
    // Clear selected job if it's the one being deleted
    if (selectedJob?.id === jobIdToDelete) {
      setSelectedJob(null);
    }
    setDeleteDialogOpen(false);
    setJobIdToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setJobIdToDelete(null);
  };

  const handleBackToJobs = () => {
    setSelectedJob(null);
  };

  const handleJobCardClick = (jobId: number) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setExpandedJobs({}); // Close all linked jobs
      setJobLogsOpenId(null); // Close logs
    }
  };

  const getFilteredJobs = () => {
    if (selectedType !== "All Types") {
      return jobs.filter((job) => job.taskDefinitionId === selectedType);
    }
    return jobs;
  };

  // Update getFilteredJobs to support pagination
  const getPaginatedJobs = () => {
    const filtered = getFilteredJobs();
    const startIdx = (currentPage - 1) * jobsPerPage;
    return filtered.slice(startIdx, startIdx + jobsPerPage);
  };

  const totalPages = Math.ceil(getFilteredJobs().length / jobsPerPage);

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

  // Function to render jobs with logs table insertion
  const renderJobsWithLogs = () => {
    const paginatedJobs = getPaginatedJobs();
    const elements = [];

    // Use the groupSize state that updates with window resize
    for (let i = 0; i < paginatedJobs.length; i += groupSize) {
      const jobGroup = paginatedJobs.slice(i, i + groupSize);

      // Add the job cards for this group
      elements.push(
        <div
          key={`group-${i}`}
          className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 xl:grid-cols-3"
        >
          {jobGroup.map((job) => (
            <div
              key={job.id}
              className=""
              ref={(el) => {
                linkedJobsRefs.current[job.id] = el;
              }}
            >
              <JobCard
                job={job}
                isLoading={loading}
                onCardClick={handleJobCardClick}
              />
            </div>
          ))}
        </div>,
      );

      // Check if any job in this group has logs open
      const jobWithLogsOpen = jobGroup.find((job) => jobLogsOpenId === job.id);
      if (jobWithLogsOpen) {
        elements.push(
          <div
            key={`logs-${jobWithLogsOpen.id}`}
            className="col-span-full"
            ref={logsRef}
          >
            {logsLoading ? (
              <JobLogsSkeleton />
            ) : logsError ? (
              <JobLogsTable
                logs={[]}
                error={logsError}
                isConnected={isConnected}
                isConnecting={isConnecting}
                useWebSocketMode={useWebSocketMode}
              />
            ) : (
              <JobLogsTable
                logs={jobLogs}
                isConnected={isConnected}
                isConnecting={isConnecting}
                useWebSocketMode={useWebSocketMode}
              />
            )}
          </div>,
        );
      }
    }

    return elements;
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
      ) : !walletConnected ? (
        <WalletConnectionCard className="border-0" />
      ) : selectedJob ? (
        <JobDetailsView
          job={selectedJob}
          onBack={handleBackToJobs}
          onJobDeleted={() => {
            const deletedId = selectedJob.id;
            setJobs((prev) => prev.filter((j) => j.id !== deletedId));
            setSelectedJob(null);
          }}
        />
      ) : (
        <>
          {getFilteredJobs().length === 0 && !error && (
            <EmptyState
              jobType={mapToJobTypeTab(selectedType)}
              type="All Types"
              chainName={chainName}
            />
          )}

          {error && <ErrorMessage error={error} />}

          {!error && getFilteredJobs().length > 0 && (
            <>
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 xl:grid-cols-3  ${styles.customScrollbar}`}
              >
                {renderJobsWithLogs()}
              </div>
              {/* Pagination Controls */}
              {getFilteredJobs().length >= 6 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={jobsPerPage}
                  onItemsPerPageChange={(count) => {
                    setJobsPerPage(count);
                    setCurrentPage(1); // Reset to first page when changing per page
                  }}
                  itemsPerPageOptions={[6, 9, 12, 18]}
                  totalItems={getFilteredJobs().length}
                  className="mt-6"
                />
              )}
            </>
          )}
        </>
      )}

      {/* Linked Jobs Section */}
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
                    onCardClick={handleJobCardClick}
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
