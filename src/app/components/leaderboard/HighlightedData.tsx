import React from "react";
import { Typography } from "../ui/Typography";
import { LucideCopyButton } from "../ui/CopyButton";
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
        return (
          <>
            <Card>
              <span>Performed</span>
              <span>56</span>
            </Card>
            <Card>
              <span>Attested</span>
              <span>60</span>
            </Card>
            <Card>
              <span>Points</span>
              <span>{data.points}</span>
            </Card>
          </>
        );
      case "developer":
        return (
          <>
            <Card>
              <span>Total Jobs</span>
              <span>50</span>
            </Card>
            <Card>
              <span>Tasks Executed</span>
              <span>30</span>
            </Card>
            <Card>
              <span>Points</span>
              <span>{data.points}</span>
            </Card>
          </>
        );
      case "contributor":
        return (
          <div className="md:col-start-3 col-start-1">
            <Card>
              <span>Points</span>
              <span>{data.points}</span>
            </Card>
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
          <LucideCopyButton text={data.address} />
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
