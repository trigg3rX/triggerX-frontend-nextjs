import React, { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { ethers } from "ethers";
import { WalletConnectionCard } from "../../common/WalletConnectionCard";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import { Button } from "../../ui/Button";
import TemplateInfoSection from "./components/TemplateInfoSection";
import ClaimEth from "./components/ClaimEth";

const PriceOracle = () => {
  const { address } = useAccount();
  const { isConnected } = useWalletConnectionContext();
  const { data } = useBalance({ address });

  const [isDeployed] = useState(false);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(true);

  useEffect(() => {
    if (data) {
      const balance = data.value;
      const requiredBalance = ethers.parseEther("0.02");
      setHasSufficientBalance(balance >= requiredBalance);
    }
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Template Info Section */}
      <TemplateInfoSection
        title="DynamicPriceOracle Template"
        description="Fetches real-time ETH/USD prices and updates the contract automatically."
        steps={[
          "Deploy - Deploy the DynamicPriceOracle proxy on OP Sepolia.",
          "Create Job - View pre-filled job data.",
          "Adjust Settings - Update interval if needed.",
          "Confirm - Finalize and activate automation. Always-on price updates, fully automated.",
        ]}
      />
      <WalletConnectionCard className="mt-4" />
      {isConnected && !isDeployed && (
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {!hasSufficientBalance && <ClaimEth />}
          <Button
            onClick={() => {}}
            disabled={!hasSufficientBalance}
            color="purple"
          >
            Deploy Contract
          </Button>
        </div>
      )}
    </div>
  );
};

export default PriceOracle;
