import React, { Suspense } from "react";
import DevHubPageContainer from "@/components/devhub/DevHubPageContainer";
import DevHubPostCardSkeleton from "@/components/skeleton/DevHubPostCardSkeleton";
import { Metadata } from "next";
import { getFullUrl } from "@/lib/metaUrl";

export const metadata: Metadata = {
  title: "Devhub | TriggerX",
  description: "TriggerX - Web3 Automation Platform.",
  openGraph: {
    title: "Devhub | TriggerX ",
    description: "TriggerX - Web3 Automation Platform.",
    url: getFullUrl("/devhub"),
    siteName: "TriggerX",
    images: [
      {
        url: getFullUrl("/OGImages/devhub.png"),
        width: 1200,
        height: 630,
        alt: "Devhub | TriggerX",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: getFullUrl("/devhub"),
  },
};

const DevHubPage = () => (
  <Suspense fallback={<DevHubPostCardSkeleton />}>
    <DevHubPageContainer />
  </Suspense>
);

export default DevHubPage;
