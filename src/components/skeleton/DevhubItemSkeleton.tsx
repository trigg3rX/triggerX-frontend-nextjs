import React from "react";
import Skeleton from "@/components/ui/Skeleton";

const DevhubItemSkeleton: React.FC = () => (
  <div className="overflow-hidden flex flex-col justify-between cursor-pointer gap-3 md:gap-4 lg:gap-6 min-h-[400px] h-full rounded-2xl bg-[#141414] border border-white/10 p-5 sm:p-6">
    <Skeleton width="100%" height={200} borderRadius={12} />
    <Skeleton width="80%" height={28} borderRadius={8} />
    <div className="flex items-center mt-auto pt-3 pb-1">
      <Skeleton width={100} height={18} borderRadius={8} className="mr-2" />
      <Skeleton width={18} height={18} borderRadius={8} />
    </div>
  </div>
);

export default DevhubItemSkeleton;
