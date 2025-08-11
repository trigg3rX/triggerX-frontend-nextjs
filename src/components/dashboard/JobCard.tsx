"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "../common/TooltipWrap";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import details from "../../assets/leaderboard/details.svg";
import update from "../../assets/leaderboard/update.svg";
import deleteIcon from "../../assets/leaderboard/delete.svg";
import networksData from "@/utils/networks.json";
import { useChainId, useSwitchChain } from "wagmi";
import Modal from "../ui/Modal";
import { Button } from "../ui/Button";
import JobCardSkeleton from "../skeleton/JobCardSkeleton";

export type JobType = {
  id: number;
  jobTitle: string;
  taskDefinitionId: string;
  status: boolean;
  job_cost_actual: string;
  timeFrame: string;
  argType: string;
  timeInterval: string;
  targetContractAddress: string;
  createdAt: string;
  targetFunction: string;
  targetChainId: string;
  linkedJobs?: JobType[];
  created_chain_id: string;
  type?: string;
  condition_type?: string;
  upper_limit?: number;
  lower_limit?: number;
  value_source_url?: string;
};

type JobCardProps = {
  job: JobType;
  expanded: boolean;
  expandedDetails: boolean;
  onToggleExpand: (jobId: number) => void;
  onToggleDetails: (jobId: number) => void;
  onDelete: (jobId: number) => void;
  disableUpdate?: boolean;
  className?: string;
  onClick?: () => void;
  isLogOpen?: boolean;
  isLoading?: boolean;
};

// Helper functions
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
  return text.length > 20 ? `${text.slice(0, 20)}...` : text;
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
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const secs = seconds % 60;

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (secs > 0) return `${seconds} sec${seconds > 1 ? "s" : ""}`;
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

const JobCard: React.FC<JobCardProps> = ({
  job,
  expanded,
  expandedDetails,
  onToggleExpand,
  onToggleDetails,
  onDelete,
  disableUpdate = false,
  className = "",
  onClick,
  isLogOpen = false,
  isLoading = false,
}) => {
  const router = useRouter();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [showUpdateWarning, setShowUpdateWarning] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const isNetworkMismatch =
    chainId !== undefined && Number(job.created_chain_id) !== Number(chainId);

  useEffect(() => {
    if (!isNetworkMismatch && pendingRoute) {
      router.push(pendingRoute);
      setPendingRoute(null);
    }
  }, [isNetworkMismatch, pendingRoute, router]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowUpdateWarning(false);
  };

  const neededNetwork = networksData.supportedNetworks.find(
    (n) => Number(job.created_chain_id) === n.id,
  );

  // Show skeleton when loading
  if (isLoading) {
    return <JobCardSkeleton />;
  }

  return (
    <Card
      expanded={expanded}
      className={`!p-0 ${
        expandedDetails ? "h-auto border border-white " : " md:h-[310px] "
      } ${
        expanded
          ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-white hover:border-b hover:border-white"
          : isLogOpen
            ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-white hover:border-b hover:border-white"
            : "border-[#2A2A2A] hover:border-[#3A3A3A]"
      } hover:transform hover:scale-[1.02] transition-transform duration-300 ease ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      <div>
        <div
          className={`flex items-center mb-4 p-3 relative ${expanded || isLogOpen ? "border-b border-white " : "border-[#2A2A2A] border-b "}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Typography
                  variant="h4"
                  color="yellow"
                  align="left"
                  className="font-bold max-w-[200px] truncate block"
                >
                  {truncateText(job.jobTitle)}
                </Typography>
              </TooltipTrigger>
              <TooltipContent>{job.jobTitle}</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            {job.linkedJobs && job.linkedJobs.length > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand(job.id);
                    }}
                    className="p-2 rounded-full text-white hover:bg-[#3A3A3A] transition-colors bg-[#2a2a2a] border-[#FFFFFF] border"
                    aria-label="Toggle Linked Jobs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-300 w-3 h-3 ${expanded ? "rotate-180" : ""}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Linked Jobs</TooltipContent>
              </Tooltip>
            ) : (
              <div style={{ width: 32, height: 32 }}></div>
            )}
            {/* Network Icon right after linked jobs button */}
            {(() => {
              const network = networksData.supportedNetworks.find(
                (n) => Number(job.targetChainId) === n.id,
              );
              const icon = network
                ? networksData.networkIcons[network.name]
                : null;
              return icon ? (
                <svg
                  viewBox={icon.viewBox}
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 bg-red-500 rounded-full"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d={icon.path}
                    fill="currentColor"
                  />
                </svg>
              ) : null;
            })()}
          </div>
        </div>
        <div className={`space-y-2 px-3`}>
          <div className="flex items-center justify-between gap-2 py-1.5">
            <Typography variant="body" color="white" align="left">
              Job Type :
            </Typography>
            <Typography variant="body" color="gray" align="right">
              {mapJobType(job.taskDefinitionId)}
            </Typography>
          </div>
          <div className="flex items-center justify-between gap-2 py-1.5">
            <Typography variant="body" color="white" align="left">
              Job Status :
            </Typography>
            <Typography
              variant="body"
              color="gray"
              align="right"
              className={`${job.status ? "text-[#4caf50]" : "text-[#ff4444]"}`}
            >
              {job.status ? "Active" : "Inactive"}
            </Typography>
          </div>
          <div className="flex items-center justify-between gap-2 py-1.5">
            <Typography variant="body" color="white" align="left">
              TG Used :
            </Typography>
            <Typography variant="body" color="gray" align="right">
              {isNaN(parseFloat(job.job_cost_actual))
                ? "N/A"
                : parseFloat(job.job_cost_actual).toFixed(2)}
            </Typography>
          </div>
          <div className="flex items-center justify-between gap-2 py-1.5">
            <Typography variant="body" color="white" align="left">
              TimeFrame :
            </Typography>
            <Typography variant="body" color="gray" align="right">
              {formatTimeframe(job.timeFrame)}
            </Typography>
          </div>

          {expandedDetails && (
            <div className="space-y-2 text-[#A2A2A2] text-sm">
              <div className="flex items-center justify-between gap-2 py-1">
                <Typography variant="body" color="white" align="left">
                  Arg Type :
                </Typography>
                <Typography variant="body" color="gray" align="right">
                  {job.argType}
                </Typography>
              </div>
              <div className="flex items-center justify-between gap-2 py-1">
                <Typography variant="body" color="white" align="left">
                  TimeInterval :
                </Typography>
                <Typography variant="body" color="gray" align="right">
                  {formatInterval(job.timeInterval)}
                </Typography>
              </div>
              <div className="flex items-start justify-between flex-col sm:flex-row md:items-center gap-2 py-1">
                <Typography variant="body" color="white" align="left">
                  Target Contract :
                </Typography>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Typography
                      variant="body"
                      color="gray"
                      align="right"
                      className="max-w-[160px] truncate block"
                    >
                      {sliceAddress(job.targetContractAddress)}
                    </Typography>
                  </TooltipTrigger>
                  <TooltipContent>{job.targetContractAddress}</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-start justify-between flex-col sm:flex-row md:items-center gap-2 py-1">
                <Typography variant="body" color="white" align="left">
                  Created At:
                </Typography>
                <Typography
                  variant="body"
                  color="gray"
                  align="right"
                  className="max-w-[160px] truncate block"
                >
                  {formatDate(job.createdAt)}
                </Typography>
              </div>
              <div className="flex items-start justify-between flex-col   sm:flex-row md:items-center gap-2 py-1">
                <Typography variant="body" color="white" align="left">
                  Target Function :
                </Typography>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Typography
                      variant="body"
                      color="gray"
                      align="right"
                      className="max-w-[160px] truncate block"
                    >
                      {truncateText(job.targetFunction)}
                    </Typography>
                  </TooltipTrigger>
                  <TooltipContent>{job.targetFunction}</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-start justify-between flex-col sm:flex-row md:items-center gap-2 py-1">
                <Typography variant="body" color="white" align="left">
                  Target ChainId :
                </Typography>
                <Typography variant="body" color="gray" align="right">
                  {job.targetChainId}
                </Typography>
              </div>

              {job.type === "Condition-based" && (
                <>
                  <div className="flex items-center justify-between gap-2 py-1.5">
                    <Typography variant="body" color="white" align="left">
                      Condition Type :
                    </Typography>
                    <Typography variant="body" color="gray" align="right">
                      {job.condition_type
                        ? formatConditionType(job.condition_type)
                        : "-"}
                    </Typography>
                  </div>

                  {job.condition_type && (
                    <>
                      {job.condition_type === "between" ? (
                        <>
                          {job.lower_limit !== undefined && (
                            <div className="flex items-center justify-between gap-2 py-1.5">
                              <Typography
                                variant="body"
                                color="white"
                                align="left"
                              >
                                Lower Limit :
                              </Typography>
                              <Typography
                                variant="body"
                                color="gray"
                                align="right"
                              >
                                {job.lower_limit}
                              </Typography>
                            </div>
                          )}
                          {job.upper_limit !== undefined && (
                            <div className="flex items-center justify-between gap-2 py-1.5">
                              <Typography
                                variant="body"
                                color="white"
                                align="left"
                              >
                                Upper Limit :
                              </Typography>
                              <Typography
                                variant="body"
                                color="gray"
                                align="right"
                              >
                                {job.upper_limit}
                              </Typography>
                            </div>
                          )}
                        </>
                      ) : (
                        job.upper_limit !== undefined && (
                          <div className="flex items-center justify-between gap-2 py-1.5">
                            <Typography
                              variant="body"
                              color="white"
                              align="left"
                            >
                              Upper Limit :
                            </Typography>
                            <Typography
                              variant="body"
                              color="gray"
                              align="right"
                            >
                              {job.upper_limit}
                            </Typography>
                          </div>
                        )
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <div
          className={`flex justify-end gap-2 mt-4 p-3 ${expanded || isLogOpen ? "border-t border-white " : "border-[#2A2A2A] border-t hover:border-[#3A3A3A]"}`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
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
                  if (!disableUpdate && !isNetworkMismatch) {
                    router.push(route);
                  } else {
                    setPendingRoute(route);
                    setShowUpdateWarning(true);
                  }
                }}
                className={`p-2 bg-[#C07AF6] rounded-full text-white ${disableUpdate ? "cursor-not-allowed" : "cursor-pointer"} hover:bg-[#a46be0] transition-colors`}
                aria-label="Update Job"
              >
                <Image src={update} alt="Update Job Icon" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Update</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(job.id);
                }}
                className="p-2 bg-[#FF5757] rounded-full text-white hover:bg-[#ff4444] transition-colors"
                aria-label="Delete Job"
              >
                <Image src={deleteIcon} alt="Delete Job Icon" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDetails(job.id);
                }}
                className="p-2 bg-[#2A2A2A] rounded-full text-white hover:bg-[#3A3A3A] transition-colors"
                aria-label={expandedDetails ? "Hide Details" : "Show Details"}
              >
                <Image src={details} alt="Details Icon" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {expandedDetails ? "Hide Details" : "Show Details"}
            </TooltipContent>
          </Tooltip>
        </div>

        <Modal isOpen={showUpdateWarning} onClose={handleClose}>
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
                onClick={handleClose}
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
    </Card>
  );
};

export default React.memo(JobCard);
