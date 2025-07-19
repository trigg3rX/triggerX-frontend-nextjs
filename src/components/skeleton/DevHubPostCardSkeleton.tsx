import React from "react";
import Skeleton from "@/components/ui/Skeleton";

const DevHubPostCardSkeleton: React.FC = () => (
  <div className="min-h-screen pb-20">
    {/* Title */}
    <Skeleton width="30%" height={40} borderRadius={12} className="mx-auto" />

    {/* Subtitle */}
    <Skeleton
      width="50%"
      height={30}
      borderRadius={8}
      className="mx-auto my-6"
    />

    <div
      className="w-full flex items-center justify-between gap-10
     mb-10 md:mb-12"
    >
      <Skeleton width={192} height={40} borderRadius={12} className="" />
      {/* Skeleton for title area */}
      <Skeleton width={160} height={40} borderRadius={9999} className="" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
      {[...Array(3)].map((_, index) => (
        <div key={index}>
          <div className="rounded-2xl">
            <Skeleton width="100%" height={350} borderRadius={12} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default DevHubPostCardSkeleton;
