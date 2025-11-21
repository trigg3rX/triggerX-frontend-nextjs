import React from "react";
import BlocklyDemo from "@/components/blockly/BlocklyDemo";
import { JobProvider } from "@/contexts/JobContext";
import { JobFormProvider } from "@/contexts/JobFormContext";
import templatesData from "@/data/templates.json";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TriggerX App | Build Automated Jobs with Visual Block Builder",
  description:
    "Create powerful on-chain automation by simply connecting visual logic blocks. No code needed. Design workflows like a puzzle and let TriggerX execute them seamlessly.",
  openGraph: {
    title: "TriggerX App | Build Automated Jobs with Visual Block Builder",
    description:
      "Create powerful on-chain automation by simply connecting visual logic blocks. No code needed. Design workflows like a puzzle and let TriggerX execute them seamlessly.",
    url: `https://app.triggerx.network/visual-job-builder`,
    siteName: "TriggerX",
    images: [
      {
        url: `https://app.triggerx.network/OGImages/build.png`,
        width: 1200,
        height: 630,
        alt: "TriggerX Visual Job Builder",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: `https://app.triggerx.network/visual-job-builder`,
  },
};

export default function Page() {
  return (
    <JobProvider templates={templatesData.templates}>
      <JobFormProvider>
        <BlocklyDemo />
      </JobFormProvider>
    </JobProvider>
  );
}
