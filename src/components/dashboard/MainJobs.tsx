"use client";

import { useState, useRef, useEffect } from "react";
import JobCard from "./JobCard";
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
import { useJobLogs } from "@/hooks/useJobLogs";
import styles from "@/app/styles/scrollbar.module.css";
import { Pagination } from "../ui/Pagination";

type MainJobsProps = {
  selectedType?: string;
  jobs: JobType[];
  setJobs: React.Dispatch<React.SetStateAction<JobType[]>>;
  loading?: boolean;
};

const MainJobs = ({
  selectedType = "All Types",
  jobs,
  setJobs,
  loading = false,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage, setJobsPerPage] = useState(6); // Allow dynamic change

  // Refs for Linked Jobs sections and Job Logs section
  const linkedJobsRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const logsRef = useRef<HTMLDivElement | null>(null);

  const { error } = { error: null };
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

  // Close all expanded states and logs when filter changes
  useEffect(() => {
    setExpandedJobs({});
    setExpandedJobDetails({});
    setExpandedLinkedJobDetails({});
    setJobLogsOpenId(null);
  }, [selectedType]);

  // Reset page to 1 when selectedType changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, jobsPerPage]);

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
    // Clear job logs if the deleted job is currently showing logs
    if (jobLogsOpenId === jobIdToDelete) {
      setJobLogsOpenId(null);
    }
    setDeleteDialogOpen(false);
    setExpandedLinkedJobDetails({});
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
      console.log("clicked job", jobId, newId);
      return newId;
    });
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

    for (let i = 0; i < paginatedJobs.length; i += 3) {
      const jobGroup = paginatedJobs.slice(i, i + 3);

      // Add the job cards for this group
      elements.push(
        <div
          key={`group-${i}`}
          className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 xl:grid-cols-3"
        >
          {jobGroup.map((job) => (
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
                isLoading={loading}
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
              <JobLogsTable logs={[]} error={logsError} />
            ) : (
              <JobLogsTable logs={jobLogs} />
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
            <>
              <div
                className={`px-5 py-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 xl:grid-cols-3  ${styles.customScrollbar}`}
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
