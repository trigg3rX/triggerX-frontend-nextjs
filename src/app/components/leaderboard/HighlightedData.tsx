import React from "react";
import { Typography } from "../ui/Typography";
import { CopyButton } from "../ui/CopyButton";
import { Card } from "../ui/Card";

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
}

const HighlightedData: React.FC<HighlightedDataProps> = ({ data, type }) => {
  if (!data) return null;

  const renderStats = () => {
    switch (type) {
      case "keeper":
        // const keeperData = data as KeeperHighlightedData;
        return (
          <>
            <Card label="Performed" value={56} />
            <Card label="Attested" value={60} />
            <Card label="Points" value={data.points} />
          </>
        );
      case "developer":
        // const developerData = data as DeveloperHighlightedData;
        return (
          <>
            <Card label="Total Jobs" value={50} />
            <Card label="Tasks Executed" value={30} />
            <Card label="Points" value={data.points} />
          </>
        );
      case "contributor":
        return (
          <div className="md:col-start-3 col-start-1">
            <Card label="Points" value={data.points} />
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
          <Card className="w-full flex items-center justify-between">
            {" "}
            <Typography variant="body" className="text-white ">
              {data.address}
            </Typography>
            <CopyButton text={data.address} />
          </Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full sm:w-full">
              {renderStats()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightedData;
