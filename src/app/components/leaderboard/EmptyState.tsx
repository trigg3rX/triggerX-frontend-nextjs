import React from "react";
import { Typography } from "../ui/Typography";

type TabType = "keeper" | "developer" | "contributor";

interface EmptyStateProps {
  type: TabType;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
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
            Stay tuned for exciting updates!
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
            No {type} data available
          </Typography>
        </>
      )}
    </div>
  );
};

export default EmptyState;
