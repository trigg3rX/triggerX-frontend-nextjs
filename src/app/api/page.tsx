import React, { Suspense } from "react";
import ApiPageSkeleton from "@/components/skeleton/ApiPageSkeleton";
import ApiClientPage from "@/components/api/ApiClientPage";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate API  | TriggerX",
  description: "TriggerX - Web3 Automation Platform.",
  openGraph: {
    title: "Generate API  | TriggerX ",
    description: "TriggerX - Web3 Automation Platform.",
    url: "https://triggerx-app-nextjs.vercel.app/api",
    siteName: "TriggerX",
    images: [
      {
        url: "https://triggerx-app-nextjs.vercel.app/OGImages/build.png",
        width: 1200,
        height: 630,
        alt: "Generate API | TriggerX",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: "https://triggerx-app-nextjs.vercel.app/api",
  },
};

export default function ApiPage() {
  return (
    <Suspense fallback={<ApiPageSkeleton />}>
      <ApiClientPage />
    </Suspense>
  );
}
