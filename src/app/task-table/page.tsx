import TaskTableSkeleton from "@/components/skeleton/TaskTableSkeleton";
import MainTaskPage from "@/components/task-table/MainTaskPage";
import React, { Suspense } from "react";

const page = () => {
  return (
    <Suspense fallback={<TaskTableSkeleton />}>
      <MainTaskPage />
    </Suspense>
  );
};

export default page;
