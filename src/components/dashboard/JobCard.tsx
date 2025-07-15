import { Tooltip, TooltipContent, TooltipTrigger } from "../common/TooltipWrap";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";
import React from "react";
import { useRouter } from "next/navigation";

export type JobType = {
  id: number;
  jobTitle: string;
  taskDefinitionId: string;
  status: string;
  job_cost_actual: string;
  timeFrame: string;
  argType: string;
  timeInterval: string;
  targetContractAddress: string;
  createdAt: string;
  targetFunction: string;
  targetChainId: string;
  linkedJobs?: JobType[];
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
  return new Date(date).toLocaleString();
};

const truncateText = (text: string) => {
  return text.length > 20 ? `${text.slice(0, 20)}...` : text;
};

// Converts seconds to the largest non-zero unit (e.g., "2 days", "4 hours", "30 min")
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

// Converts seconds to the largest non-zero unit (e.g., "2 days", "4 hours", "30 sec")
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

const JobCard: React.FC<JobCardProps> = ({
  job,
  expanded,
  expandedDetails,
  onToggleExpand,
  onToggleDetails,
  onDelete,
  disableUpdate = false,
  className = "",
}) => {
  const router = useRouter();
  return (
    <Card
      expanded={expanded}
      className={`!p-0 relative ${expandedDetails ? "h-auto border border-white " : "h-[310px] "} ${expanded ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324]  border border-white hover:border-b hover:border-white  " : "border-[#2A2A2A] hover:border-[#3A3A3A] "} hover:transform hover:scale-[1.02] transition-transform duration-300 ease ${className}`}
    >
      <div>
        <div
          className={`flex justify-between items-center mb-4 p-3  ${expanded ? "border-b border-white " : "border-[#2A2A2A] border-b "}`}
        >
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
          <div
            style={{
              width: 40,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {job.linkedJobs && job.linkedJobs.length > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onToggleExpand(job.id)}
                    className="p-2  rounded-full text-white hover:bg-[#3A3A3A] transition-colors bg-[#2a2a2a] border-[#FFFFFF] border"
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
              // Placeholder to keep header height consistent
              <div style={{ width: 32, height: 32 }}></div>
            )}
          </div>
        </div>
        <div className={` space-y-2  px-3 `}>
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
            <Typography variant="body" color="gray" align="right">
              {job.status}
            </Typography>
          </div>
          <div className="flex items-center justify-between gap-2 py-1.5">
            <Typography variant="body" color="white" align="left">
              TG Used :
            </Typography>
            <Typography variant="body" color="gray" align="right">
              {parseFloat(job.job_cost_actual).toFixed(2)}
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
            <div className=" space-y-2 text-[#A2A2A2] text-sm">
              <div className="flex items-center justify-between gap-2 py-1">
                <Typography variant="body" color="white" align="left">
                  Avg Type :
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
              <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1">
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
              <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1">
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
              <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1">
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
              <div className="flex items-start justify-between flex-col md:flex-row md:items-center gap-2 py-1">
                <Typography variant="body" color="white" align="left">
                  Target ChainId :
                </Typography>
                <Typography variant="body" color="gray" align="right">
                  {job.targetChainId}
                </Typography>
              </div>
            </div>
          )}
        </div>
        <div
          className={`flex justify-end gap-2 mt-4  p-3  ${expanded ? "border-t border-white " : "border-[#2A2A2A] border-t hover:border-[#3A3A3A]"}`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                // disabled={disableUpdate}
                onClick={() => {
                  if (!disableUpdate) {
                    router.push(`/?jobId=${job.id}`);
                  }
                }}
                className={`p-2 bg-[#C07AF6] rounded-full text-white ${disableUpdate ? "cursor-not-allowed" : "cursor-pointer"} hover:bg-[#a46be0] transition-colors`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.1998 3.2793C13.7298 3.2793 16.6298 5.8893 17.1198 9.2793H19.1998L15.6998 13.2793L12.1998 9.2793H14.5198C14.2959 8.30049 13.7469 7.42647 12.9623 6.79988C12.1777 6.1733 11.2039 5.83116 10.1998 5.8293C8.7498 5.8293 7.4698 6.5393 6.6598 7.6093L4.9498 5.6593C5.60453 4.91111 6.41174 4.31164 7.31724 3.90115C8.22275 3.49065 9.2056 3.27862 10.1998 3.2793ZM9.7998 16.7193C6.2798 16.7193 3.3698 14.1093 2.8798 10.7193H0.799805L4.2998 6.7193C5.4698 8.0493 6.6298 9.3893 7.7998 10.7193H5.4798C5.70369 11.6981 6.25273 12.5721 7.03732 13.1987C7.82191 13.8253 8.79572 14.1674 9.7998 14.1693C11.2498 14.1693 12.5298 13.4593 13.3398 12.3893L15.0498 14.3393C14.3959 15.0885 13.5889 15.6887 12.6832 16.0992C11.7775 16.5098 10.7942 16.7213 9.7998 16.7193Z"
                    fill="white"
                  />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent>Update</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDelete(job.id)}
                className="p-2 bg-[#FF5757] rounded-full text-white hover:bg-[#ff4444] transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.33317 4.99935H11.6665C11.6665 4.55732 11.4909 4.1334 11.1783 3.82084C10.8658 3.50828 10.4419 3.33268 9.99984 3.33268C9.55781 3.33268 9.13389 3.50828 8.82133 3.82084C8.50877 4.1334 8.33317 4.55732 8.33317 4.99935ZM6.6665 4.99935C6.6665 4.11529 7.01769 3.26745 7.64281 2.64233C8.26794 2.01721 9.11578 1.66602 9.99984 1.66602C10.8839 1.66602 11.7317 2.01721 12.3569 2.64233C12.982 3.26745 13.3332 4.11529 13.3332 4.99935H17.4998C17.7208 4.99935 17.9328 5.08715 18.0891 5.24343C18.2454 5.39971 18.3332 5.61167 18.3332 5.83268C18.3332 6.0537 18.2454 6.26566 18.0891 6.42194C17.9328 6.57822 17.7208 6.66602 17.4998 6.66602H16.7648L16.0265 15.2827C15.9555 16.1147 15.5748 16.8898 14.9597 17.4546C14.3446 18.0194 13.5399 18.3328 12.7048 18.3327H7.29484C6.45976 18.3328 5.65507 18.0194 5.03996 17.4546C4.42486 16.8898 4.04415 16.1147 3.97317 15.2827L3.23484 6.66602H2.49984C2.27882 6.66602 2.06686 6.57822 1.91058 6.42194C1.7543 6.26566 1.6665 6.0537 1.6665 5.83268C1.6665 5.61167 1.7543 5.39971 1.91058 5.24343C2.06686 5.08715 2.27882 4.99935 2.49984 4.99935H6.6665ZM12.4998 9.99935C12.4998 9.77833 12.412 9.56637 12.2558 9.41009C12.0995 9.25381 11.8875 9.16602 11.6665 9.16602C11.4455 9.16602 11.2335 9.25381 11.0772 9.41009C10.921 9.56637 10.8332 9.77833 10.8332 9.99935V13.3327C10.8332 13.5537 10.921 13.7657 11.0772 13.9219C11.2335 14.0782 11.4455 14.166 11.6665 14.166C11.8875 14.166 12.0995 14.0782 12.2558 13.9219C12.412 13.7657 12.4998 13.5537 12.4998 13.3327V9.99935ZM8.33317 9.16602C8.11216 9.16602 7.9002 9.25381 7.74392 9.41009C7.58763 9.56637 7.49984 9.77833 7.49984 9.99935V13.3327C7.49984 13.5537 7.58763 13.7657 7.74392 13.9219C7.9002 14.0782 8.11216 14.166 8.33317 14.166C8.55418 14.166 8.76615 14.0782 8.92243 13.9219C9.07871 13.7657 9.1665 13.5537 9.1665 13.3327V9.99935C9.1665 9.77833 9.07871 9.56637 8.92243 9.41009C8.76615 9.25381 8.55418 9.16602 8.33317 9.16602Z"
                    fill="white"
                  />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onToggleDetails(job.id)}
                className="p-2 bg-[#2A2A2A] rounded-full text-white hover:bg-[#3A3A3A] transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {expandedDetails ? "Hide Details" : "Show Details"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
};

export default JobCard;
