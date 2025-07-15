import { Suspense } from "react";
import { CreateJobLayout } from "@/components/create-job/CreateJobLayout";
import { JobFormProvider } from "@/contexts/JobFormContext";
import CreateJobSkeleton from "@/components/skeleton/CreateJobSkeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TriggerX App | Automate Everything Onchain",
  description:
    "Access the TriggerX App to create, manage, and run automated onchain tasks with shared security. Fast, reliable, and trust-minimized.",
  openGraph: {
    title: "TriggerX App | Secure Onchain Automation",
    description:
      "Access the TriggerX App to create, manage, and run automated onchain tasks with shared security. Fast, reliable, and trust-minimized.",
    url: `https://triggerx-app-nextjs.vercel.app/`,
    siteName: "TriggerX",
    images: [
      {
        url: `https://triggerx-app-nextjs.vercel.app/OGImages/build.png`,
        width: 1200,
        height: 630,
        alt: "TriggerX App interface",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: `https://triggerx-app-nextjs.vercel.app/`,
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
