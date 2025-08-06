"use client";

import * as React from "react";
import Skeleton from "../ui/Skeleton";

export function TableSkeleton() {
  return (
    <div className="flex gap-4 mb-8 w-full md:flex-col flex-col">
      <Skeleton height={50} />
      <Skeleton height={40} />
      <Skeleton height={40} />
      <Skeleton height={40} />
      <Skeleton height={40} />
      <Skeleton height={40} />
      <Skeleton height={40} />
    </div>
  );
}
