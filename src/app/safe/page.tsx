import MainSafeWallet from "@/components/safe-wallet/MainSafeWallet";
import { Typography } from "@/components/ui/Typography";
import LeaderboardSkeleton from "@/components/skeleton/LeaderboardSkeleton";
import { Suspense } from "react";

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
