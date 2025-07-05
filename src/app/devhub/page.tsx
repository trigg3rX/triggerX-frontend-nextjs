import React, { Suspense } from "react";
import DevHubPageContainer from "@/components/devhub/DevHubPageContainer";
import DevHubPostCardSkeleton from "@/components/skeleton/DevHubPostCardSkeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devhub | TriggerX",
  description: "TriggerX - Web3 Automation Platform.",
  openGraph: {
    title: "Devhub | TriggerX ",
    description: "TriggerX - Web3 Automation Platform.",
    url: `https://triggerx-app-nextjs.vercel.app/devhub`,
    siteName: "TriggerX",
    images: [
      {
        url: `https://triggerx-app-nextjs.vercel.app/OGImages/devhub.png`,
        width: 1200,
        height: 630,
        alt: "Devhub | TriggerX",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: `https://triggerx-app-nextjs.vercel.app/devhub`,
  },
};

const DevHubPage = () => (
  <Suspense fallback={<DevHubPostCardSkeleton />}>
    <DevHubPageContainer />
  </Suspense>
);

export default DevHubPage;
