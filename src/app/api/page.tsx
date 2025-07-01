import React, { Suspense } from "react";
import ApiPageSkeleton from "@/components/skeleton/ApiPageSkeleton";
import ApiClientPage from "@/components/api/ApiClientPage";

export default function ApiPage() {
  return (
    <Suspense fallback={<ApiPageSkeleton />}>
      <ApiClientPage />
    </Suspense>
  );
}
