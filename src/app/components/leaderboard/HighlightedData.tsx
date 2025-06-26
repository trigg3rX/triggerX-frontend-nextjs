import React from "react";
import { Typography } from "../ui/Typography";
import { CopyButton } from "../ui/CopyButton";
import { Card } from "../ui/Card";
import { MainContainer } from "../ui/MainContainer";
import { HighlightedDataType } from "@/types/leaderboard";
import useTruncateAddress from "@/hooks/useTruncateAddress";

interface HighlightedDataProps {
  data: HighlightedDataType;
  type: "keeper" | "developer" | "contributor";
}

const HighlightedData: React.FC<HighlightedDataProps> = ({ data, type }) => {
  const truncateAddress = useTruncateAddress();
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
    <MainContainer className="border-yellow-100">
      <div className="flex lg:flex-row md:flex-col flex-col gap-4 items-center">
        <Card className="w-full flex items-center justify-between">
          {" "}
          <Typography variant="body" className="text-white hidden md:block">
            {data.address}
          </Typography>
          <Typography variant="body" className="text-white md:hidden block">
            {truncateAddress(data.address)}
          </Typography>
          <CopyButton text={data.address} />
        </Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full sm:w-full">
            {renderStats()}
          </div>
        </div>
      </div>
    </MainContainer>
  );
};

export default HighlightedData;
