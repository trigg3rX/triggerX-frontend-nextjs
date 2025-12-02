import React from "react";
import Skeleton from "@/components/ui/Skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="w-[90%] mx-auto">
      <div className="md:w-[40%] mx-auto w-full ">
        <Skeleton height={60} borderRadius={12} />
      </div>
      <div className="flex justify-evenly gap-5 lg:flex-row flex-col my-6">
        <div className="xl:w-[73%] lg:w-[70%] w-full">
          {/* ActiveJobs Skeleton */}
          <div className="space-y-4">
            <Skeleton height={420} borderRadius={12} />
          </div>
        </div>
        <div className="space-y-6 sm:space-y-8 h-full xl:w-[25%] lg:w-[30%] w-full">
          {/* ETHBalance Skeleton */}
          <Skeleton height={120} borderRadius={12} />
          {/* QuickActions Skeleton */}
          <Skeleton height={120} borderRadius={12} />
          {/* Statistics Skeleton */}
          <div className="space-y-2">
            <Skeleton height={120} borderRadius={8} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
