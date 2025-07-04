import React from "react";
import { Typography } from "../ui/Typography";
import Link from "next/link";

type TabType = "keeper" | "developer" | "contributor";
type JobTypeTab =
  | "All Types"
  | "Time-based"
  | "Event-based"
  | "Condition-based";

interface EmptyStateProps {
  type: TabType;
  jobType?: JobTypeTab;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, jobType }) => {
  // Dashboard job type empty state
  if (jobType) {
    let message = "No jobs available";
    if (jobType !== "All Types") {
      message = `No ${jobType} jobs available`;
    }
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-[#A2A2A2] w-full col-span-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-4"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        <Typography variant="h4" color="gray" className="text-center mb-2">
          ❌ {message}
        </Typography>
        <Typography variant="body" color="gray" className="text-center">
          <Link
            href="/"
            className="underline transition-all underline-offset-4 hover:text-[#F8ff7c]/80 mt-4"
          >
            Try creating a new job to get started !
          </Link>
        </Typography>
      </div>
    );
  }
  // Leaderboard fallback
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-[#A2A2A2] w-full col-span-full">
      {type === "contributor" ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <Typography
            variant="h4"
            color="gray"
            className="mb-2 text-center"
            noWrap={false}
          >
            Contributor Leaderboard Coming Soon
          </Typography>
          <Typography variant="body" color="gray" className="text-center">
            ✨ Stay tuned for exciting updates !
          </Typography>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <Typography variant="h4" color="gray" className="text-center">
            ❌ No {type} data available
          </Typography>
        </>
      )}
    </div>
  );
};

export default EmptyState;
