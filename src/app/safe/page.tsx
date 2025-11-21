import MainSafeWallet from "@/components/safe-wallet/MainSafeWallet";
import { Typography } from "@/components/ui/Typography";
import LeaderboardSkeleton from "@/components/skeleton/LeaderboardSkeleton";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TriggerX Safe Wallet | Create, Import & Manage Safe Wallets",
  description:
    "Create and import Safe wallets, manage TriggerX module integration, view token balances, send assets, and automate jobs—all in one unified interface for Safe wallet management.",
  openGraph: {
    title: "TriggerX Safe Wallet | Safe Wallet Management & Automation",
    description:
      "Create and import Safe wallets, manage TriggerX module integration, view token balances, send assets, and automate jobs—all in one unified interface for Safe wallet management.",
    url: `https://app.triggerx.network/safe`,
    siteName: "TriggerX",
    images: [
      {
        url: `https://app.triggerx.network/OGImages/build.png`,
        width: 1200,
        height: 630,
        alt: "TriggerX Safe Wallet interface showing wallet creation, token balances, job automation, and TriggerX module management",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: `https://app.triggerx.network/safe`,
  },
};

export default function Safe() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <div>
        <Typography variant="h1" color="primary">
          Safe Wallet
        </Typography>
        <Typography variant="h4" color="secondary" className="my-6">
          Manage your Safe wallets, view balances and templates, and run jobs on
          a single page.
        </Typography>
        <MainSafeWallet />
      </div>
    </Suspense>
  );
}
