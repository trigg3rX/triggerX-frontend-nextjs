import React from "react";
import Skeleton from "@/components/ui/Skeleton";

const DevHubPostContainerSkeleton: React.FC = () => (
  <div className="min-h-screen md:mt-[17rem] mt-[10rem]">
    <div className="h-[180px] xs:h-[200px] sm:h-[300px] md:h-[500px] lg:h-[600px] mb-4">
      <Skeleton width="100%" height="100%" borderRadius={24} />
    </div>
    <div className="flex flex-col md:flex-row gap-4 mx-auto">
      {/* Table of Content Skeleton */}
      <aside className="w-full aspect-video md:w-1/4 min-w-[180px] lg:min-w-[230px] md:sticky top-24 h-[50px] md:h-[300px]">
        <Skeleton
          width="full"
          height={300}
          borderRadius={24}
          className="hidden md:flex"
        />
        <Skeleton
          width="full"
          height={50}
          borderRadius={24}
          className="flex md:hidden"
        />
      </aside>
      {/* Blog Content Skeleton */}
      <article className="w-full md:w-3/4">
        <Skeleton width="100%" height={600} borderRadius={24} />
      </article>
    </div>
  </div>
);

export default DevHubPostContainerSkeleton;
