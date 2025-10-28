import MainSafeWallet from "@/components/safe-wallet/MainSafeWallet";
import { Typography } from "@/components/ui/Typography";
import LeaderboardSkeleton from "@/components/skeleton/LeaderboardSkeleton";
import { Suspense } from "react";

export default function Safe() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <Typography variant="h1" color="primary">
        Safe Wallet
      </Typography>
      <Typography variant="h4" color="secondary" className="my-6">
        View and Manage your safe wallets, its associated jobs, create
        automation task via templates from one place.
      </Typography>
      <MainSafeWallet />
    </Suspense>
  );
}
