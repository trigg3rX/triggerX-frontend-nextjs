import React from "react";
import { Metadata } from "next";
import VisualJobBuilderEntry from "./VisualJobBuilderEntry";

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
  return <VisualJobBuilderEntry />;
}
