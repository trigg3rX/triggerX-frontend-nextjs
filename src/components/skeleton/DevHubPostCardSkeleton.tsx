import React from "react";
import Skeleton from "@/components/ui/Skeleton";

const DevHubPostCardSkeleton: React.FC = () => (
  <div className="min-h-screen md:mt-[12rem] mt-[8rem] w-[90%] mx-auto pb-20">
    <div className="w-full flex flex-col sm:flex-row items-center justify-between mb-10 md:mb-12">
      <Skeleton
        width={192}
        height={40}
        borderRadius={12}
        className="opacity-0"
      />
      {/* Skeleton for title area */}
      <Skeleton
        width={160}
        height={40}
        borderRadius={9999}
        className="mt-4 sm:mt-0 opacity-0"
      />
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
