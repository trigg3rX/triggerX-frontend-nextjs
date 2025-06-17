import React from "react";
import { Typography } from "../ui/Typography";
import { CopyButton } from "../ui/CopyButton";

interface BaseHighlightedData {
  name: string;
  address: string;
  points: number;
}

interface KeeperHighlightedData extends BaseHighlightedData {
  performed: number;
  attested: number;
}

interface DeveloperHighlightedData extends BaseHighlightedData {
  totalJobs: number;
  tasksExecuted: number;
}

interface ContributorHighlightedData extends BaseHighlightedData {
  contributions?: number;
  communityPoints?: number;
}

type HighlightedDataType =
  | KeeperHighlightedData
  | DeveloperHighlightedData
  | ContributorHighlightedData;

interface HighlightedDataProps {
  data: HighlightedDataType;
  type: "keeper" | "developer" | "contributor";
  onViewProfile?: (address: string) => void;
}

const StatCard: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="bg-[#181818] rounded-[10px] px-3 sm:px-4 py-2 border border-[#5F5F5F] md:w-full sm:w-auto">
    <Typography variant="body" className="text-gray-400 mb-1">
      {label}
    </Typography>
    <Typography variant="body" className="text-white font-semibold">
      {typeof value === "number" ? Number(value).toFixed(2) : value}
    </Typography>
  </div>
);

const HighlightedData: React.FC<HighlightedDataProps> = ({
  data,
  type,
  onViewProfile,
}) => {
  if (!data) return null;

  const renderStats = () => {
    switch (type) {
      case "keeper":
        // const keeperData = data as KeeperHighlightedData;
        return (
          <>
            <StatCard label="Performed" value={56} />
            <StatCard label="Attested" value={60} />
            <StatCard label="Points" value={data.points} />
          </>
        );
      case "developer":
        // const developerData = data as DeveloperHighlightedData;
        return (
          <>
            <StatCard label="Total Jobs" value={50} />
            <StatCard label="Tasks Executed" value={30} />
            <StatCard label="Points" value={data.points} />
          </>
        );
      case "contributor":
        return <StatCard label="Points" value={data.points} />;
      default:
        return null;
    }
  };

  const renderTitle = () => {
    const titleClasses =
      "bg-[#181818] p-2 sm:p-3 rounded-[10px] border border-[#5f5f5f]";

    switch (type) {
      case "keeper":
        return (
          <div
            className={`${titleClasses} flex items-center gap-1  justify-between`}
          >
            <Typography variant="body" className="text-gray-400 break-all">
              <span className="">{data.address}</span>
            </Typography>
            <CopyButton text={data.address} />
          </div>
        );
      case "developer":
        return (
          <div
            className={`${titleClasses} flex items-center gap-1  justify-between`}
          >
            <Typography variant="body" className="text-gray-400 break-all">
              <span className="">{data.address}</span>
            </Typography>
            <CopyButton text={data.address} />
          </div>
        );
      case "contributor":
        return (
          <div
            className={`${titleClasses} flex items-center gap-1  justify-between`}
          >
            <Typography variant="body" className="text-gray-400 break-all">
              <span className="">{data.address}</span>
            </Typography>
            <CopyButton text={data.address} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#212020] rounded-[10px]">
      <div className="mb-4 sm:mb-8 p-4 sm:p-6 rounded-[10px] shadow-lg bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#5f5f5f]">
        <div className="flex lg:flex-row md:flex-col flex-col gap-4 items-center">
          <div className="w-full">{renderTitle()}</div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-full">
              {renderStats()}
            </div>
            {onViewProfile && (
              <div className="w-full sm:w-auto text-center sm:text-left">
                <div
                  onClick={() => onViewProfile(data.address)}
                  className="px-4 sm:px-5 py-2 text-sm sm:text-md text-white underline decoration-2 decoration-white underline-offset-4 w-full sm:w-auto"
                >
                  View Profile
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightedData;
