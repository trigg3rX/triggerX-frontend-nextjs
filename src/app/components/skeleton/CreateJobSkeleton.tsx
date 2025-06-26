import React from "react";
import Skeleton from "@/app/components/ui/Skeleton";

const CreateJobSkeleton: React.FC = () => (
  <div className="space-y-8">
    {/* Title */}
    <Skeleton width="40%" height={60} borderRadius={12} className="mx-auto" />

    {/* Subtitle */}
    <Skeleton width="30%" height={30} borderRadius={8} className="mx-auto" />

    {/* Points System & Trigger Type */}
    <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 ">
      <Skeleton width="33%" height={160} borderRadius={16} />
      <Skeleton width="66%" height={160} borderRadius={16} />
    </div>

    {/* Template & Job Form */}
    <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 ">
      <Skeleton width="33%" height={320} borderRadius={16} />
      <Skeleton width="66%" height={400} borderRadius={8} />
    </div>
  </div>
);

export default CreateJobSkeleton;
