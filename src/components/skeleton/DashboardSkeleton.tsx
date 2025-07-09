import React from "react";
import Skeleton from "@/components/ui/Skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="w-[90%] mx-auto">
      <Skeleton width="40%" height={60} borderRadius={12} className="mx-auto" />

      <Skeleton height={50} width={300} borderRadius={12} className="my-6" />
      <div className="flex justify-evenly gap-5 lg:flex-row flex-col my-6">
        <div className="xl:w-[73%] lg:w-[70%] w-full">
          {/* ActiveJobs Skeleton */}
          <div className="space-y-4">
            <Skeleton height={420} borderRadius={12} />
          </div>
        </div>
        <div className="space-y-6 sm:space-y-8 h-full xl:w-[25%] lg:w-[30%] w-full">
          {/* TgBalance Skeleton */}
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
