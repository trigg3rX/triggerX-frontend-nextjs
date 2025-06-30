import React from "react";
import { Typography } from "../ui/Typography";
import { LucideCopyButton } from "../ui/CopyButton";
import { Card } from "../ui/Card";
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
        return (
          <>
            <Card className="w-full flex items-start justify-between  flex-col">
              {" "}
              <Typography variant="body">Performed</Typography>
              <Typography variant="body">56</Typography>
            </Card>
            <Card className="w-full flex items-start justify-between  flex-col">
              {" "}
              <Typography variant="body">Attested</Typography>
              <Typography variant="body">60</Typography>
            </Card>
            <Card className="w-full flex items-start justify-between  flex-col">
              {" "}
              <Typography variant="body">Points</Typography>
              <Typography variant="body">{data.points}</Typography>
            </Card>
          </>
        );
      case "developer":
        return (
          <>
            <Card className="w-full flex items-start justify-between  flex-col">
              {" "}
              <Typography variant="body">Total Jobs</Typography>
              <Typography variant="body">50</Typography>
            </Card>
            <Card className="w-full flex items-start justify-between  flex-col">
              {" "}
              <Typography variant="body">Tasks Executed</Typography>
              <Typography variant="body">30</Typography>
            </Card>
            <Card className="w-full flex items-start justify-between  flex-col">
              {" "}
              <Typography variant="body">Points</Typography>
              <Typography variant="body">{data.points}</Typography>
            </Card>
          </>
        );
      case "contributor":
        return (
          <div className="md:col-start-3 col-start-1">
            <Card className="w-full flex items-start justify-between  flex-col">
              {" "}
              <Typography variant="body">Points</Typography>
              <Typography variant="body">{data.points}</Typography>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-yellow-100">
      <div className="flex lg:flex-row md:flex-col flex-col gap-4 items-center">
        <Card className="w-full flex items-center justify-between ">
          {" "}
          <Typography variant="body" className="text-white hidden md:block">
            {data.address}
          </Typography>
          <Typography variant="body" className="text-white md:hidden block">
            {truncateAddress(data.address)}
          </Typography>
          <LucideCopyButton text={data.address} />
        </Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full sm:w-full">
            {renderStats()}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HighlightedData;
