import React from "react";
import Skeleton from "../ui/Skeleton";

const LeaderboardSkeleton: React.FC = () => {
  return (
    <div className="w-[90%] mx-auto">
      <div className="md:w-[40%] mx-auto w-full ">
        <Skeleton height={60} borderRadius={12} />
      </div>

      <div className="flex justify-between my-6 lg:flex-row flex-col gap-4">
        <div>
          <Skeleton height={28} width={220} className="mb-2" />
          <Skeleton height={40} width={220} className="mb-1" />
        </div>
        <Skeleton height={50} width={220} borderRadius={20} />
      </div>
      {/* Tabs Skeleton */}
      <div className="flex gap-4 mb-8 w-full md:flex-row flex-col">
        <Skeleton height={60} />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </div>

      {/* Table Skeleton */}
      <Skeleton height={350} />
    </div>
  );
};

export default LeaderboardSkeleton;
