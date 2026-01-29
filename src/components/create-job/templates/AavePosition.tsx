import React from "react";
import { WalletConnectionCard } from "@/components/common/WalletConnectionCard";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import TemplateInfoSection from "./components/TemplateInfoSection";
import { Button } from "@/components/ui/Button";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { useJob } from "@/contexts/JobContext";
import {
  getSafeModuleAddress,
  getAavePoolAddress,
  getWethAddress,
} from "@/utils/contractAddresses";
import { resolveAavePlaceholders } from "@/utils/aaveTransactionHelpers";
import TriggerXSafeModuleArtifact from "@/artifacts/TriggerXSafeModule.json";
import AavePoolArtifact from "@/artifacts/AavePool.json";
import ERC20Artifact from "@/artifacts/ERC20.json";
import { ethers } from "ethers";
import { useChainId, useAccount } from "wagmi";

const MAX_UINT256 =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

const AavePosition = () => {
  const { isConnected } = useWalletConnectionContext();

  return (
    <div className="space-y-6 sm:space-y-8">
      <TemplateInfoSection
        title="Maintain Aave Position Template"
        description="Automatically monitor your Aave V3 health factor and execute supply/approve transactions via Safe wallet when the health factor falls below a safe threshold. This template uses condition-based triggers to protect your position from liquidation."
        steps={[
          "Ensure you have an active Aave V3 position and a funded Safe wallet.",
          "Clone the Aave TriggerX repo: https://github.com/trigg3rX/aave-triggerX.",
          "Follow the README to set up your environment.",
          "Deploy the health-factor API (or use ngrok).",
          "Make sure the API is publicly accessible and returns the health factor.",
          "Add your API URL in the Source URL field.",
          "Optionally update token address or parameters to supply a different asset.",
          "Fund your Safe with choose assets to supply and ETH for gas.",
          "Finalize and activate the automation. Your position will be monitored 24/7.",
        ]}
      />
      <WalletConnectionCard className="mt-4" />

      {isConnected && (
        <div className="flex justify-center mt-4 sm:mt-6">
          <CreateJobButton />
        </div>
      )}
    </div>
  );
};

const CreateJobButton: React.FC = () => {
  const jobForm = useJobFormContext();
  const { handleCreateCustomJob } = useJob();
  const chainId = useChainId();
  const { address: connectedEOA } = useAccount();

  const handleCreateJob = async () => {
    const aavePoolAddress = getAavePoolAddress(chainId);
    const wethAddress = getWethAddress(chainId);

    if (!aavePoolAddress || !wethAddress) {
      console.error(
        "[AavePosition] Aave addresses not configured for chain:",
        chainId,
      );
      alert(
        `Aave addresses are not configured for the current network (chainId: ${chainId}). Please switch to a supported network.`,
      );
      return;
    }

    handleCreateCustomJob();

    jobForm.setJobType(2);

    jobForm.setJobTitle("Aave Health Factor Guard");

    const networkNameMap: Record<number, string> = {
      11155420: "OP Sepolia",
      84532: "Base Sepolia",
      421614: "Arbitrum Sepolia",
      42161: "Arbitrum",
    };
    const networkName = networkNameMap[chainId] || "OP Sepolia";
    jobForm.setSelectedNetwork(networkName);

    jobForm.setTimeframe({ days: 1, hours: 0, minutes: 0 });

    jobForm.setRecurring(false);

    jobForm.setExecutionMode("safe");

    const moduleAddress = getSafeModuleAddress(chainId);
    if (moduleAddress) {
      jobForm.handleSetContractDetails(
        "contract",
        moduleAddress,
        JSON.stringify(TriggerXSafeModuleArtifact.abi),
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const execJobFunction =
      "execJobFromHub(address,address,uint256,bytes,uint8,address)";
    jobForm.handleFunctionChange("contract", execJobFunction);

    jobForm.handleArgumentTypeChange("contract", "static");

    jobForm.handleSourceTypeChange("contract", "api");

    jobForm.handleConditionTypeChange("contract", "less_equal");

    jobForm.handleUpperLimitChange("contract", "1.2");

    const erc20Interface = new ethers.Interface(ERC20Artifact.abi);
    const approveData = erc20Interface.encodeFunctionData("approve", [
      aavePoolAddress,
      ethers.MaxUint256,
    ]);

    const defaultSupplyAmountEth = "0.1";

    const safeTransactions = [
      {
        to: wethAddress,
        value: "0",
        data: approveData,
        defaultFunctionSignature: "approve(address,uint256)",
        defaultArgumentValues: [aavePoolAddress, MAX_UINT256],
        defaultAbi: JSON.stringify(ERC20Artifact.abi),
      },
      {
        to: aavePoolAddress,
        value: "0",
        data: "0x",
        defaultFunctionSignature: "supply(address,uint256,address,uint16)",
        defaultArgumentValues: [
          "__TOKEN_TX2_ADDRESS__",
          defaultSupplyAmountEth,
          "__CONNECTED_EOA__",
          "0",
        ],
        defaultAbi: JSON.stringify(AavePoolArtifact.abi),
      },
    ];

    // Resolve Aave-specific placeholders before passing to SafeTransactionBuilder
    const resolvedTransactions = resolveAavePlaceholders(
      safeTransactions,
      connectedEOA,
    );

    jobForm.handleSafeTransactionsChange("contract", resolvedTransactions);
  };

  return (
    <Button color="yellow" onClick={handleCreateJob}>
      Create Job
    </Button>
  );
};

export default AavePosition;
