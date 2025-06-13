import React from "react";

type TabType = "keeper" | "developer" | "contributor";

interface EmptyStateProps {
  type: TabType;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  return (
    <tr>
      <td
        colSpan={type === "contributor" ? 3 : 6}
        className="text-center text-[#A2A2A2] py-5"
      >
        <div className="flex flex-col items-center justify-center h-[200px] text-[#A2A2A2]">
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
              <p className="text-sm sm:text-base lg:text-lg mb-2">
                Contributor Leaderboard Coming Soon
              </p>
              <p className="text-sm text-[#A2A2A2]">
                Stay tuned for exciting updates!
              </p>
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
              <p className="text-sm sm:text-base lg:text-lg mb-2">
                No {type} data available
              </p>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default EmptyState;
