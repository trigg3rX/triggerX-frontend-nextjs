import React from "react";
import Skeleton from "@/components/ui/Skeleton";

const CreateJobSkeleton: React.FC = () => (
  <div className="space-y-6 sm:space-y-8">
    <div className="md:w-[40%] mx-auto w-full ">
      <Skeleton height={60} borderRadius={12} />
    </div>

    {/* Points System & Trigger Type */}
    <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 ">
      <Skeleton height={160} borderRadius={16} className="md:w-[30%] w-full" />
      <Skeleton height={160} borderRadius={16} className="md:w-[70%] w-full" />
    </div>

    {/* Template & Job Form */}
    <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 ">
      <Skeleton height={400} borderRadius={16} className="md:w-[30%] w-full" />
      <Skeleton height={400} borderRadius={8} className="md:w-[70%] w-full" />
    </div>
  </div>
);

export default CreateJobSkeleton;
