"use client";
import React, { Suspense } from "react";
import DevHubPageContainer from "@/components/devhub/DevHubPageContainer";
import DevHubPostCardSkeleton from "@/components/skeleton/DevHubPostCardSkeleton";

const DevHubPage = () => (
  <Suspense fallback={<DevHubPostCardSkeleton />}>
    <DevHubPageContainer />
  </Suspense>
);

export default DevHubPage;
