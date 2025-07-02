"use client";
import React, { Suspense } from "react";
import DevHubPostContainer from "@/components/devhub/DevHubPostContainer";
import DevHubPostContainerSkeleton from "@/components/skeleton/DevHubPostContainerSkeleton";

const DevHubPostPage = () => (
  <Suspense fallback={<DevHubPostContainerSkeleton />}>
    <DevHubPostContainer />
  </Suspense>
);

export default DevHubPostPage;
