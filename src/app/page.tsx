import { Suspense } from "react";
import { CreateJobLayout } from "@/components/create-job/CreateJobLayout";
import { JobFormProvider } from "@/contexts/JobFormContext";
import CreateJobSkeleton from "@/components/skeleton/CreateJobSkeleton";
import { getFullUrl } from "@/lib/metaUrl";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a Job | TriggerX",
  description: "TriggerX - Web3 Automation Platform.",
  openGraph: {
    title: "Create a Job  | TriggerX ",
    description: "TriggerX - Web3 Automation Platform.",
    url: getFullUrl("/"),
    siteName: "TriggerX",
    images: [
      {
        url: getFullUrl("/OGImages/build.png"),
        width: 1200,
        height: 630,
        alt: "Create a Job | TriggerX",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: getFullUrl("/"),
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
