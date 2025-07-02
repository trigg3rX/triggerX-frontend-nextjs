import React from "react";
import Skeleton from "../ui/Skeleton";

const ApiPageSkeleton = () => (
  <div className="">
    <Skeleton height={60} width="40%" className="mb-10 mx-auto" />
    <Skeleton height={40} width="100%" className="mb-6" />
    <Skeleton rows={1} columns={2} height={300} width="50%" className="mb-4" />
  </div>
);

export default ApiPageSkeleton;
