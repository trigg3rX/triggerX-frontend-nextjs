import React from "react";
import Skeleton from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";

const SingleJobCardSkeleton: React.FC = () => {
  return (
    <Card className="!p-0 relative h-[310px] border-[#2A2A2A] hover:border-[#3A3A3A] hover:transform hover:scale-[1.02] transition-transform duration-300 ease">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-4 p-3 border-b border-[#2A2A2A] ">
          {/* Title skeleton */}
          <Skeleton
            width={200}
            height={28}
            borderRadius={6}
            className="max-w-[200px]"
          />
          {/* Expand/LinkedJobs icon skeleton or placeholder */}
          {/* <Skeleton width={32} height={32} borderRadius={16} /> */}
        </div>
      </div>
    </Card>
  );
};

const JobCardSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 xl:grid-cols-3">
      {[...Array(3)].map((_, idx) => (
        <SingleJobCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export default JobCardSkeleton;
