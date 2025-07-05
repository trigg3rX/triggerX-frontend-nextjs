import { Suspense } from "react";
import { CreateJobLayout } from "@/components/create-job/CreateJobLayout";
import { JobFormProvider } from "@/contexts/JobFormContext";
import CreateJobSkeleton from "@/components/skeleton/CreateJobSkeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TriggerX",
  description: "TriggerX - Web3 Automation Platform.",
  openGraph: {
    title: "TriggerX ",
    description: "TriggerX - Web3 Automation Platform.",
    url: "https://triggerx-app-nextjs.vercel.app/",
    siteName: "TriggerX",
    images: [
      {
        url: "https://triggerx-app-nextjs.vercel.app/OGImages/trigger-og.png",
        width: 1200,
        height: 630,
        alt: "TriggerX",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: "https://triggerx-app-nextjs.vercel.app/",
  },
};

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a Job | TriggerX",
  description: "TriggerX - Web3 Automation Platform.",
  openGraph: {
    title: "Create a Job  | TriggerX ",
    description: "TriggerX - Web3 Automation Platform.",
    url: "https://triggerx-app-nextjs.vercel.app/",
    siteName: "TriggerX",
    images: [
      {
        url: "https://triggerx-app-nextjs.vercel.app/OGImages/build.png",
        width: 1200,
        height: 630,
        alt: "Create a Job | TriggerX",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: "https://triggerx-app-nextjs.vercel.app/",
  },
};

export default function Home() {
  return (
    <Suspense fallback={<CreateJobSkeleton />}>
      <JobFormProvider>
        <CreateJobLayout />
      </JobFormProvider>
    </Suspense>
  );
}
