import React from "react";
import Skeleton from "@/components/ui/Skeleton";

const DevHubPostContainerSkeleton: React.FC = () => (
  <div className="min-h-screen md:mt-[17rem] mt-[10rem]">
    <Skeleton
      width="100%"
      height={500}
      borderRadius={24}
      className="mx-auto mb-4"
    />
    <div className="flex flex-col md:flex-row gap-2 md:gap-8 mx-auto">
      {/* Table of Content Skeleton */}
      <aside className="w-full aspect-video md:w-1/4 min-w-[180px] lg:min-w-[230px] md:sticky top-24 h-full">
        <Skeleton width="full" height={300} borderRadius={24} />
      </aside>
      {/* Blog Content Skeleton */}
      <article className="w-full md:w-3/4">
        <Skeleton width="100%" height={600} borderRadius={24} />
      </article>
    </div>
  </div>
);

export default DevHubPostContainerSkeleton;
