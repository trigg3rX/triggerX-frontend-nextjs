import React, { Suspense } from "react";
import DevHubPageContainer from "@/components/devhub/DevHubPageContainer";
import DevHubPostCardSkeleton from "@/components/skeleton/DevHubPostCardSkeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TriggerX Dev Hub | Build on Automation",
  description:
    "Explore developer documentation, guides, and resources for building with TriggerX. Start automating smart contracts the right way.",
  openGraph: {
    title: "TriggerX Dev Hub | Developer Docs & Tools",
    description:
      "Explore developer documentation, guides, and resources for building with TriggerX. Start automating smart contracts the right way.",
    url: `https://triggerx-app-nextjs.vercel.app/devhub`,
    siteName: "TriggerX",
    images: [
      {
        url: `https://triggerx-app-nextjs.vercel.app/OGImages/devhub.png`,
        width: 1200,
        height: 630,
        alt: "TriggerX developer portal preview",
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
