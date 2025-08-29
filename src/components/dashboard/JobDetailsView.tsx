"use client";

import React, { useState, useRef } from "react";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";
import {
  ArrowLeft,
  FileText,
  Settings,
  Link,
  Trash2,
  Edit,
} from "lucide-react";
import { JobType } from "@/hooks/useJobs";
import { useJobLogs } from "@/hooks/useJobLogs";
import JobLogsTable from "./JobLogsTable";
import JobLogsSkeleton from "./JobLogsSkeleton";
import { LucideCopyButton } from "../ui/CopyButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../common/TooltipWrap";
import JobCard from "./JobCard";
import LinkedJobDetailsView from "./LinkedJobDetailsView";
import DeleteDialog from "../common/DeleteDialog";
import { useDeleteJob } from "@/hooks/useDeleteJob";
import { useRouter } from "next/navigation";
import { useChainId, useSwitchChain } from "wagmi";
import networksData from "@/utils/networks.json";
import Modal from "../ui/Modal";
import { Button } from "../ui/Button";

interface JobDetailsViewProps {
  job: JobType;
  onBack: () => void;
  onJobDeleted?: () => void;
}

// Helper functions (same as JobCard)
const mapJobType = (type: string) => {
  const types: { [key: string]: string } = {
    PRICE_MONITOR: "Price Monitor",
    GAS_MONITOR: "Gas Monitor",
  };
  return types[type] || type;
};

const sliceAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatDate = (date: string) => {
  const parsedDate = new Date(date);
  return isNaN(parsedDate.getTime())
    ? "Invalid Date"
    : parsedDate.toLocaleString();
};

const truncateText = (text: string) => {
  return text.length > 50 ? `${text.slice(0, 50)}...` : text;
};

const formatTimeframe = (secondsString: string) => {
  const seconds = parseInt(secondsString, 10);
  if (isNaN(seconds)) return secondsString;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (mins > 0) return `${mins} min${mins > 1 ? "s" : ""}`;
  return "0 min";
};

const formatInterval = (secondsString: string) => {
  const seconds = parseInt(secondsString, 10);
  if (isNaN(seconds)) return secondsString;

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (mins > 0) return `${mins} min${mins > 1 ? "s" : ""}`;
  if (secs > 0) return `${secs} sec${secs > 1 ? "s" : ""}`;
  return "0 sec";
};

const formatConditionType = (conditionType: string) => {
  switch (conditionType) {
    case "greater_than":
      return "Greater Than";
    case "less_than":
      return "Less Than";
    case "equals":
      return "Equals";
    case "not_equals":
      return "Not Equals";
    case "less_equal":
      return "Less Than or Equal To";
    case "between":
      return "Between";
    default:
      return conditionType
        .replace("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
};

type TabType = "details" | "logs" | "linkedJobs";

const JobDetailsView: React.FC<JobDetailsViewProps> = ({
  job,
  onBack,
  onJobDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [highlightStyle, setHighlightStyle] = useState({
    width: "0px",
    left: "0px",
    opacity: 0,
    height: "100%",
  });
  const [selectedLinkedJob, setSelectedLinkedJob] = useState<JobType | null>(
    null,
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showUpdateWarning, setShowUpdateWarning] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { deleteJob, loading: deleteLoading } = useDeleteJob();

  const {
    logs: jobLogs,
    loading: logsLoading,
    error: logsError,
  } = useJobLogs(job.id);

  const isNetworkMismatch =
    chainId !== undefined && Number(job.created_chain_id) !== Number(chainId);

  const neededNetwork = networksData.supportedNetworks.find(
    (n) => Number(job.created_chain_id) === n.id,
  );

  const tabs = [
    {
      id: "details" as TabType,
      label: "Job Details",
      icon: Settings,
      count: null,
    },
    {
      id: "logs" as TabType,
      label: "Job Logs",
      icon: FileText,
      count: jobLogs?.length || 0,
    },
    {
      id: "linkedJobs" as TabType,
      label: "Linked Jobs",
      icon: Link,
      count: job.linkedJobs?.length || 0,
    },
  ];

  const handleTabMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const tabsRect = tabsRef.current?.getBoundingClientRect();

    if (tabsRect) {
      setHighlightStyle({
        width: `${rect.width}px`,
        left: `${rect.left - tabsRect.left}px`,
        opacity: 1,
        height: `${rect.height}px`,
      });
    }
  };

  const handleTabMouseLeave = () => {
    setHighlightStyle({
      width: "0px",
      left: "0px",
      opacity: 0,
      height: "100%",
    });
  };

  const handleLinkedJobClick = (jobId: number) => {
    const linkedJob = job.linkedJobs?.find((j) => j.id === jobId);
    if (linkedJob) {
      setSelectedLinkedJob(linkedJob);
    }
  };

  const handleBackToLinkedJobs = () => {
    setSelectedLinkedJob(null);
  };

  const handleDeleteJob = async () => {
    await deleteJob(job.id);
    setDeleteDialogOpen(false);
    if (onJobDeleted) {
      onJobDeleted();
    }
  };

  const handleUpdateJob = () => {
    const query = new URLSearchParams({
      jobId: String(job.id),
      oldJobName: job.jobTitle,
      jobType: job.taskDefinitionId,
      oldTimeFrame: job.timeFrame,
      targetContract: job.targetContractAddress,
      oldData: JSON.stringify({
        targetFunction: job.targetFunction,
        argType: job.argType,
        timeInterval: job.timeInterval,
        condition_type: job.condition_type,
        upper_limit: job.upper_limit?.toString(),
        lower_limit: job.lower_limit?.toString(),
      }),
    }).toString();
    const route = `/?${query}`;

    if (!isNetworkMismatch) {
      router.push(route);
    } else {
      setShowUpdateWarning(true);
    }
  };

  const handleCloseUpdateWarning = () => {
    setShowUpdateWarning(false);
  };

  // If a linked job is selected, show its details view
  if (selectedLinkedJob) {
    return (
      <LinkedJobDetailsView
        job={selectedLinkedJob}
        onBack={handleBackToLinkedJobs}
        onJobDeleted={() => {
          // Remove the deleted job from the linked jobs list
          if (job.linkedJobs) {
            // Update the job object (this would need to be handled by the parent component)
            // For now, we'll just go back to the linked jobs list
            setSelectedLinkedJob(null);
          }
        }}
        onViewMainJob={onBack}
      />
    );
  }

  return (
    <div className="space-y-6 my-10">
      {/* Header with back button, job title, and action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
          <div
            onClick={onBack}
            className="flex items-center gap-2 cursor-pointer text-sm sm:text-base"
          >
            <ArrowLeft color="gray" className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 items-start sm:items-center">
            <Typography
              variant="h2"
              color="yellow"
              className="text-sm sm:text-2xl font-bold text-left break-words"
            >
              {job.jobTitle}
            </Typography>

            <Typography
              variant="h3"
              color={job.is_active ? "success" : "error"}
              className="text-xs sm:text-base"
            >
              {job.is_active ? "Active" : "Inactive"}
            </Typography>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleUpdateJob}
                className="p-2 bg-[#C07AF6] rounded-full text-white hover:bg-[#a46be0] transition-colors"
                aria-label="Update Job"
              >
                <Edit className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Update Job</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="p-2 bg-[#FF5757] rounded-full text-white hover:bg-[#ff4444] transition-colors"
                aria-label="Delete Job"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete Job</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Tab Navigation with Hover Effect */}
      <div
        ref={tabsRef}
        className="relative bg-[#1A1A1A] p-1 rounded-lg border border-[#2A2A2A]"
        onMouseLeave={handleTabMouseLeave}
      >
        {/* Hover Highlight - Hidden on mobile */}
        <div
          className="absolute bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A] rounded-md transition-all duration-300 hidden sm:block"
          style={{
            ...highlightStyle,
            position: "absolute",
            transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
            pointerEvents: "none",
          }}
        />

        <div className="relative flex flex-col sm:flex-row flex-wrap sm:flex-nowrap space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onMouseEnter={handleTabMouseEnter}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-200 relative z-10 text-sm sm:text-base flex-1 sm:flex-none justify-center sm:justify-start ${
                  isActive
                    ? " bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A] rounded-md"
                    : "text-gray-400 sm:hover:text-white"
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`px-1 sm:px-2 py-0.5 text-xs rounded-full ${
                      isActive ? " text-[#F8FF7C]" : " text-[#F8FF7C]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}

      {activeTab === "details" && (
        <Card className="!border-0 !p-0">
          <div className="space-y-6">
            {/* Job Status and Type */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Typography variant="h3" color="primary">
                  {mapJobType(job.taskDefinitionId)}
                </Typography>
              </div>
            </div>

            {/* Job Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                  <Typography variant="body" color="primary">
                    TG Used:
                  </Typography>
                  <Typography
                    variant="body"
                    color="gray"
                    className="font-semibold"
                  >
                    {isNaN(parseFloat(job.job_cost_actual))
                      ? "N/A"
                      : parseFloat(job.job_cost_actual).toFixed(2)}
                  </Typography>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                  <Typography variant="body" color="primary">
                    Time Frame:
                  </Typography>
                  <Typography
                    variant="body"
                    color="gray"
                    className="font-semibold"
                  >
                    {formatTimeframe(job.timeFrame)}
                  </Typography>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                  <Typography variant="body" color="primary">
                    Created At:
                  </Typography>
                  <Typography
                    variant="body"
                    color="gray"
                    className="font-semibold"
                  >
                    {formatDate(job.createdAt)}
                  </Typography>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                  <Typography variant="body" color="primary">
                    Target Contract:
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Typography
                      variant="body"
                      color="gray"
                      className="font-semibold"
                    >
                      {sliceAddress(job.targetContractAddress)}
                    </Typography>
                    <LucideCopyButton text={job.targetContractAddress} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                  <Typography variant="body" color="primary">
                    Function:
                  </Typography>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Typography
                        variant="body"
                        color="gray"
                        className="font-semibold"
                      >
                        {truncateText(job.targetFunction)}
                      </Typography>
                    </TooltipTrigger>
                    <TooltipContent>{job.targetFunction}</TooltipContent>
                  </Tooltip>
                </div>
                {job.next_execution_timestamp && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                    <Typography variant="body" color="primary">
                      Next Execution:
                    </Typography>
                    <Typography
                      variant="body"
                      color="gray"
                      className="font-semibold"
                    >
                      {formatDate(job.next_execution_timestamp)}
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            {/* Time-based specific details */}
            {job.type === "Time-based" && (
              <div className="border-t border-[#2A2A2A] pt-4">
                <Typography
                  variant="h3"
                  color="primary"
                  className="mb-3 flex items-center gap-2"
                >
                  Time-based details
                </Typography>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                    <Typography variant="body" color="primary">
                      Time Interval:
                    </Typography>
                    <Typography
                      variant="body"
                      color="gray"
                      className="font-semibold"
                    >
                      {formatInterval(job.timeInterval)}
                    </Typography>
                  </div>
                </div>
              </div>
            )}

            {/* Condition-based specific details */}
            {job.type === "Condition-based" && (
              <div className="border-t border-[#2A2A2A] pt-4">
                <Typography
                  variant="h3"
                  color="primary"
                  className="mb-3 flex items-center gap-2"
                >
                  Condition-based details
                </Typography>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                    <Typography variant="body" color="primary">
                      Condition Type:
                    </Typography>
                    <Typography
                      variant="body"
                      color="gray"
                      className="font-semibold"
                    >
                      {job.condition_type
                        ? formatConditionType(job.condition_type)
                        : "-"}
                    </Typography>
                  </div>
                  {job.condition_type === "between" ? (
                    <>
                      {job.lower_limit !== undefined && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                          <Typography variant="body" color="primary">
                            Lower Limit:
                          </Typography>
                          <Typography
                            variant="body"
                            color="gray"
                            className="font-semibold"
                          >
                            {job.lower_limit}
                          </Typography>
                        </div>
                      )}
                      {job.upper_limit !== undefined && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                          <Typography variant="body" color="primary">
                            Upper Limit:
                          </Typography>
                          <Typography
                            variant="body"
                            color="gray"
                            className="font-semibold"
                          >
                            {job.upper_limit}
                          </Typography>
                        </div>
                      )}
                    </>
                  ) : (
                    job.upper_limit !== undefined && (
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between p-3 rounded-lg bg-[#2A2A2A]/50 transition-colors duration-200">
                        <Typography variant="body" color="primary">
                          Upper Limit:
                        </Typography>
                        <Typography
                          variant="body"
                          color="gray"
                          className="font-semibold"
                        >
                          {job.upper_limit}
                        </Typography>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === "logs" && (
        <Card className="!border-0 !p-0">
          {logsLoading ? (
            <JobLogsSkeleton />
          ) : logsError ? (
            <JobLogsTable logs={[]} error={logsError} />
          ) : (
            <JobLogsTable logs={jobLogs} />
          )}
        </Card>
      )}

      {activeTab === "linkedJobs" && (
        <Card className="!border-0 !p-0">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h3" color="primary">
              Linked Jobs
            </Typography>
          </div>

          {job.linkedJobs && job.linkedJobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {job.linkedJobs.map((linkedJob) => (
                <JobCard
                  key={linkedJob.id}
                  job={linkedJob}
                  onCardClick={handleLinkedJobClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Typography variant="body" color="gray">
                No linked jobs found for this job.
              </Typography>
            </div>
          )}
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Job"
        description="Are you sure you want to delete this job? This action cannot be undone."
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteJob}
        confirmText={deleteLoading ? "Deleting..." : "Delete"}
        cancelText="Cancel"
      />

      {/* Network Mismatch Modal */}
      <Modal isOpen={showUpdateWarning} onClose={handleCloseUpdateWarning}>
        <div className="p-4 text-center space-y-4">
          <Typography variant="h2" color="yellow">
            Network Mismatch
          </Typography>
          <Typography variant="h3" color="white" className="!text-wrap">
            Please switch to the{" "}
            {neededNetwork ? neededNetwork.name : job.created_chain_id} to
            continue.
          </Typography>
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={handleCloseUpdateWarning}
              style={{ minWidth: 140 }}
              disabled={isSwitching}
            >
              Cancel
            </Button>
            <Button
              color="yellow"
              style={{ minWidth: 140 }}
              onClick={() => {
                if (switchChain && neededNetwork) {
                  switchChain({ chainId: neededNetwork.id });
                }
                setShowUpdateWarning(false);
              }}
              disabled={!switchChain || !neededNetwork || isSwitching}
            >
              {isSwitching ? "Switching..." : `Change Network`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JobDetailsView;
