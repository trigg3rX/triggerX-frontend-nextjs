"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "../common/TooltipWrap";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import networksData from "@/utils/networks.json";
import { useChainId, useSwitchChain } from "wagmi";
import Modal from "../ui/Modal";
import { Button } from "../ui/Button";
import JobCardSkeleton from "../skeleton/JobCardSkeleton";
import { JobType } from "@/hooks/useJobs";

type JobCardProps = {
  job: JobType;

  className?: string;
  onClick?: () => void;

  isLoading?: boolean;
  onCardClick?: (jobId: number) => void;
};

// Helper functions
const mapJobType = (type: string) => {
  const types: { [key: string]: string } = {
    PRICE_MONITOR: "Price Monitor",
    GAS_MONITOR: "Gas Monitor",
  };
  return types[type] || type;
};

const truncateText = (text: string) => {
  return text.length > 20 ? `${text.slice(0, 20)}...` : text;
};

const formatTimeframe = (secondsString: string) => {
  const seconds = parseInt(secondsString, 10);
  if (isNaN(seconds)) return secondsString;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const totalMinutes = (seconds % 3600) / 60;
  const mins = Math.floor(totalMinutes);
  const secs = seconds % 60;

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (totalMinutes >= 10) return `${mins} min${mins !== 1 ? "s" : ""}`;
  if (totalMinutes >= 1) {
    // Show 1 decimal place for minutes under 10
    const formattedMins = totalMinutes.toFixed(1);
    // Remove .0 if it's a whole number
    const displayMins = formattedMins.endsWith(".0")
      ? formattedMins.slice(0, -2)
      : formattedMins;
    return `${displayMins} min${totalMinutes !== 1 ? "s" : ""}`;
  }
  return `${secs} sec${secs !== 1 ? "s" : ""}`;
};

const JobCard: React.FC<JobCardProps> = ({
  job,

  className = "",
  onClick,
  isLoading = false,
  onCardClick,
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
      className={`!p-0 group hover:bg-gradient-to-r hover:from-[#D9D9D924] hover:to-[#14131324] hover:border hover:border-white transition-all duration-300 ease ${className} ${
        onCardClick || onClick
          ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          : ""
      }`}
      onClick={onCardClick ? () => onCardClick(job.id) : onClick}
    >
      <div>
        <div
          className={`flex items-center p-3 relative border-[#2A2A2A] border-b group-hover:border-white`}
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
          {(onCardClick || onClick) && (
            <div className="flex items-center gap-1 text-gray-400 group-hover:text-white transition-colors duration-200">
              <span className="text-xs hidden sm:block">View Details</span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}
        </div>
        <div className={`space-y-2 px-3 my-4`}>
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
              className={`${job.is_active ? "text-[#4caf50]" : "text-[#ff4444]"}`}
            >
              {job.is_active ? "Running" : "Completed"}
            </Typography>
          </div>
          <div className="flex items-center justify-between gap-2 py-1.5">
            <Typography variant="body" color="white" align="left">
              TG Used :
            </Typography>
            <Typography variant="body" color="gray" align="right">
              {isNaN(parseFloat(job.job_cost_actual))
                ? "N/A"
                : parseFloat(job.job_cost_actual).toFixed(6)}
            </Typography>
          </div>
          <div className="flex items-center justify-between gap-2 py-1.5">
            <Typography variant="body" color="white" align="left">
              Time Frame :
            </Typography>
            <Typography variant="body" color="gray" align="right">
              {formatTimeframe(job.timeFrame)}
            </Typography>
          </div>
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
