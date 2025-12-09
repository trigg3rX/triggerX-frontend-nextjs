import React from "react";
import Skeleton from "@/components/ui/Skeleton";

const TaskTableSkeleton = () => {
  return (
    <div className="">
      {/* Title Skeleton */}
      <div className="mb-4">
        <Skeleton height={60} width="40%" borderRadius={12} />
      </div>

      {/* Subtitle Skeleton */}
      <div className="mb-6">
        <Skeleton height={24} width="60%" borderRadius={8} />
      </div>

      {/* Filter Card Skeleton */}
      <div className="mb-6 p-6 border border-white/10 rounded-2xl">
        <div className="space-y-4">
          {/* Dropdown Skeleton */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6">
            <Skeleton height={20} width={100} borderRadius={8} />
            <div className="w-full md:w-[70%]">
              <Skeleton height={48} borderRadius={12} />
            </div>
          </div>
          {/* Input Field Skeleton */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6">
            <Skeleton height={20} width={120} borderRadius={8} />
            <div className="w-full md:w-[70%]">
              <Skeleton height={48} borderRadius={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="p-4 border border-white/10 rounded-2xl">
            <Skeleton
              height={16}
              width="80%"
              borderRadius={8}
              className="mb-2"
            />
            <Skeleton height={32} width="60%" borderRadius={8} />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="p-6 border border-white/10 rounded-2xl">
        {/* Table Header */}
        <div className="mb-4">
          <Skeleton height={50} borderRadius={8} />
        </div>
        {/* Table Rows */}
        <div className="space-y-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} height={60} borderRadius={8} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskTableSkeleton;
