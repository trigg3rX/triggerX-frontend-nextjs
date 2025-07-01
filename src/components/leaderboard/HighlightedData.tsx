import React from "react";
import { Typography } from "../ui/Typography";
import { LucideCopyButton } from "../ui/CopyButton";
import { Card } from "../ui/Card";
import { HighlightedDataType } from "@/types/leaderboard";
import useTruncateAddress from "@/hooks/useTruncateAddress";
import useCountUp from "@/hooks/useCountUp";

interface HighlightedDataProps {
  data: HighlightedDataType;
  type: "keeper" | "developer" | "contributor";
}

const HighlightedData: React.FC<HighlightedDataProps> = (
  props,
): React.ReactElement | null => {
  const { data, type } = props;

  // Move all hooks to the top level, before any conditional returns
  const truncateAddress = useTruncateAddress();

  const performed = data
    ? "performed" in data
      ? (data.performed ?? 0)
      : 0
    : 0;
  const attested = data ? ("attested" in data ? (data.attested ?? 0) : 0) : 0;
  const points = data ? (data.points ?? 0) : 0;
  const totalJobs = data
    ? "totalJobs" in data
      ? (data.totalJobs ?? 0)
      : 0
    : 0;
  const tasksExecuted = data
    ? "tasksExecuted" in data
      ? (data.tasksExecuted ?? 0)
      : 0
    : 0;

  const performedCount = useCountUp(performed);
  const attestedCount = useCountUp(attested);
  const pointsCount = useCountUp(points);
  const totalJobsCount = useCountUp(totalJobs);
  const tasksExecutedCount = useCountUp(tasksExecuted);

  // Now you can safely return early after all hooks have been called
  if (!data) return null;

  const renderStats = (
    performedCount: number,
    attestedCount: number,
    pointsCount: number,
    totalJobsCount: number,
    tasksExecutedCount: number,
  ) => {
    switch (type) {
      case "keeper":
        return (
          <>
            <Card className="w-full  !p-4 bg-[#1a1a1a]    ">
              {" "}
              <Typography variant="body" color="gray" className="mb-2">
                Performed
              </Typography>
              <Typography
                variant="body"
                color="primary"
                className="font-bold tracking-wide"
              >
                {performedCount}
              </Typography>
            </Card>
            <Card className="w-full  !p-4 bg-[#1a1a1a]    ">
              {" "}
              <Typography variant="body" color="gray" className="mb-2">
                Attested
              </Typography>
              <Typography
                variant="body"
                color="primary"
                className="font-bold tracking-wide"
              >
                {attestedCount}
              </Typography>
            </Card>
            <Card className="w-full  !p-4 bg-[#1a1a1a]  ">
              {" "}
              <Typography variant="body" color="gray" className="mb-2">
                Points
              </Typography>
              <Typography
                variant="body"
                color="primary"
                className="font-bold tracking-wide"
              >
                {pointsCount}
              </Typography>
            </Card>
          </>
        );
      case "developer":
        return (
          <>
            <Card className="w-full  !p-4 bg-[#1a1a1a]">
              {" "}
              <Typography variant="body" color="gray" className="mb-2">
                Total Jobs
              </Typography>
              <Typography
                variant="body"
                color="primary"
                className="font-bold tracking-wide"
              >
                {totalJobsCount}
              </Typography>
            </Card>
            <Card className="w-full  !p-4 bg-[#1a1a1a]    ">
              {" "}
              <Typography variant="body" color="gray" className="mb-2">
                Tasks Executed
              </Typography>
              <Typography
                variant="body"
                color="primary"
                className="font-bold tracking-wide"
              >
                {tasksExecutedCount}
              </Typography>
            </Card>
            <Card className="w-full  !p-4 bg-[#1a1a1a]">
              {" "}
              <Typography variant="body" color="gray" className="mb-2">
                Points
              </Typography>
              <Typography
                variant="body"
                color="primary"
                className="font-bold tracking-wide"
              >
                {pointsCount}
              </Typography>
            </Card>
          </>
        );
      case "contributor":
        return (
          <div className="md:col-start-3 col-start-1">
            <Card className="w-full  !p-4 bg-[#1a1a1a]">
              {" "}
              <Typography variant="body" color="gray" className="mb-2">
                Points
              </Typography>
              <Typography
                variant="body"
                color="primary"
                className="font-bold tracking-wide"
              >
                {pointsCount}
              </Typography>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-yellow-100 hover:border-yellow-100 transition-all duration-300 mb-10">
      <div className="flex lg:flex-row md:flex-col flex-col gap-4 items-center">
        <Card className="w-full flex items-center justify-between !p-5 bg-[#1a1a1a]">
          {" "}
          <Typography variant="body" className=" hidden md:block">
            {data.address}
          </Typography>
          <Typography variant="body" className=" md:hidden block">
            {truncateAddress(data.address)}
          </Typography>
          <LucideCopyButton text={data.address} />
        </Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full sm:w-full">
            {renderStats(
              performedCount,
              attestedCount,
              pointsCount,
              totalJobsCount,
              tasksExecutedCount,
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HighlightedData;
