import React from "react";
import Skeleton from "../ui/Skeleton";

const SafeWalletSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 p-4 sm:p-6">
      {/* Sidebar Skeleton */}
      <div className="h-full xl:w-[25%] w-full">
        <div className="space-y-4">
          {/* Card Header */}
          <Skeleton height={32} width={150} borderRadius={8} />

          {/* Safe Wallet Items */}
          <div className="space-y-3">
            <Skeleton height={80} borderRadius={12} />
            <Skeleton height={80} borderRadius={12} />
            <Skeleton height={80} borderRadius={12} />
          </div>

          {/* Import Button */}
          <Skeleton height={44} borderRadius={8} />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="w-full xl:w-[75%]">
        <div className="space-y-6">
          {/* Tab Navigation Skeleton */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
            <Skeleton height={36} width={80} borderRadius={8} />
            <Skeleton height={36} width={80} borderRadius={8} />
          </div>

          {/* Content Cards Skeleton */}
          <div className="space-y-4">
            <Skeleton height={120} borderRadius={12} />
            <Skeleton height={120} borderRadius={12} />
            <Skeleton height={120} borderRadius={12} />
            <Skeleton height={120} borderRadius={12} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeWalletSkeleton;
