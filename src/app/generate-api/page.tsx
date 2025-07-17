import React, { Suspense } from "react";
import ApiPageSkeleton from "@/components/skeleton/ApiPageSkeleton";
import ApiClientPage from "@/components/api/ApiClientPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TriggerX API Access | Generate & Manage API Keys",
  description:
    "Generate your API key, access TriggerX endpoints, and start building automation workflows. Full documentation and support available in the API Console.",
  openGraph: {
    title: "TriggerX API | Secure Your Access & Start Building",
    description:
      "Generate your API key, access TriggerX endpoints, and start building automation workflows. Full documentation and support available in the API Console.",
    url: `https://triggerx-app-nextjs.vercel.app/generate-api`,
    siteName: "TriggerX",
    images: [
      {
        url: `https://triggerx-app-nextjs.vercel.app/OGImages/api.png`,

        width: 1200,
        height: 630,
        alt: "TriggerX API key generation interface",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: `https://triggerx-app-nextjs.vercel.app/generate-api`,
  },
};

export default function ApiPage() {
  return (
    <Suspense fallback={<ApiPageSkeleton />}>
      <ApiClientPage />
    </Suspense>
  );
}
