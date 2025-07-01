import React from "react";
import Skeleton from "../ui/Skeleton";

const ApiPageSkeleton = () => (
  <div className="w-[90%] mx-auto mt-10">
    <Skeleton height={48} width="40%" className="mb-10" />
    <Skeleton height={40} width="100%" className="mb-6" />
    <Skeleton rows={3} columns={2} height={32} width="48%" className="mb-4" />
    <Skeleton rows={6} columns={1} height={20} width="100%" />
  </div>
);

export default ApiPageSkeleton;
