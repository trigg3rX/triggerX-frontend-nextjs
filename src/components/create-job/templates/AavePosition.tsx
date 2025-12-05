import React from "react";
import { WalletConnectionCard } from "../../common/WalletConnectionCard";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import TemplateInfoSection from "./components/TemplateInfoSection";
import { Button } from "../../ui/Button";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { useJob } from "@/contexts/JobContext";
import { getSafeModuleAddress, getRpcUrl } from "@/utils/contractAddresses";
import TriggerXSafeModuleArtifact from "@/artifacts/TriggerXSafeModule.json";
import AavePoolArtifact from "@/artifacts/AavePool.json";
import ERC20Artifact from "@/artifacts/ERC20.json";
import { ethers } from "ethers";
import { useChainId } from "wagmi";

// Contract addresses on OP Sepolia
const AAVE_POOL_ADDRESS = "0xb50201558B00496A145fE76f7424749556E326D8";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
const MAX_UINT256 =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const OP_SEPOLIA_CHAIN_ID = 11155420;

const AavePosition = () => {
  const { isConnected } = useWalletConnectionContext();

  return (
    <div className="space-y-6 sm:space-y-8">
      <TemplateInfoSection
        title="Maintain Aave Position Template"
        description="Automatically monitor your Aave V3 health factor and execute supply/approve transactions via Safe wallet when the health factor falls below a safe threshold. This template uses condition-based triggers to protect your position from liquidation."
        steps={[
          "Prerequisites - Have an existing Aave V3 position and a funded Safe wallet on OP Sepolia.",
          "Setup API - Deploy and expose your health-factor monitoring API endpoint (see documentation).",
          "Create Job - Click 'Create Job' to pre-fill the job form with Aave-specific settings.",
          "Configure Safe Transactions - Fill in the specific parameters for the supply and approve functions.",
          "Enter API URL - Paste your public health-factor API endpoint URL in the Source URL field.",
          "Activate - Finalize and activate the automation. Your position will be monitored 24/7.",
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

// Helper function to fetch WETH balance for a Safe wallet (returns in ETH format)
const fetchWETHBalance = async (
  safeAddress: string,
  chainId: number,
): Promise<string> => {
  try {
    const rpcUrl = getRpcUrl(chainId);
    if (!rpcUrl) {
      throw new Error(`No RPC URL configured for chain ${chainId}`);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wethContract = new ethers.Contract(
      WETH_ADDRESS,
      [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
      ],
      provider,
    );

    // Fetch balance and decimals
    const [balance, decimals] = await Promise.all([
      wethContract.balanceOf(safeAddress),
      wethContract.decimals().catch(() => 18), // Default to 18 if decimals() fails
    ]);

    // Convert to ETH format for display
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error("[AavePosition] Failed to fetch WETH balance:", error);
    // Return 0 if fetch fails
    return "0";
  }
};

const CreateJobButton: React.FC = () => {
  const jobForm = useJobFormContext();
  const { handleCreateCustomJob } = useJob();
  const chainId = useChainId();

  const handleCreateJob = async () => {
    console.log("[AavePosition] Starting job setup...");

    // Switch to custom job form
    handleCreateCustomJob();

    // Set TriggerX type to condition-based (2)
    jobForm.setJobType(2);
    console.log("[AavePosition] Job type set to: 2 (condition-based)");

    // Set job title
    jobForm.setJobTitle("Aave Health Factor Guard");
    console.log("[AavePosition] Job title set to: Aave Health Factor Guard");

    // Set network to OP Sepolia
    jobForm.setSelectedNetwork("OP Sepolia");
    console.log("[AavePosition] Network set to: OP Sepolia");

    // Set timeframe to 1 day
    jobForm.setTimeframe({ days: 1, hours: 0, minutes: 0 });
    console.log("[AavePosition] Timeframe set to: 1 day");

    // Set recurring to false
    jobForm.setRecurring(false);
    console.log("[AavePosition] Recurring set to: false");

    // Set execution mode to Safe wallet
    jobForm.setExecutionMode("safe");
    console.log("[AavePosition] Execution mode set to: safe");

    // Configure Safe module address and ABI
    const moduleAddress = getSafeModuleAddress(OP_SEPOLIA_CHAIN_ID);
    if (moduleAddress) {
      console.log("[AavePosition] Setting Safe module address:", moduleAddress);
      jobForm.handleSetContractDetails(
        "contract",
        moduleAddress,
        JSON.stringify(TriggerXSafeModuleArtifact.abi),
      );
    }

    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Select the execJobFromHub function (Safe module function)
    const execJobFunction =
      "execJobFromHub(address,address,uint256,bytes,uint8)";
    jobForm.handleFunctionChange("contract", execJobFunction);
    console.log("[AavePosition] Function set to:", execJobFunction);

    // Set argument type to static
    jobForm.handleArgumentTypeChange("contract", "static");
    console.log("[AavePosition] Argument type set to: static");

    // Configure condition-based settings
    // Source type is already "api" by default
    jobForm.handleSourceTypeChange("contract", "api");
    console.log("[AavePosition] Source type set to: api");

    // Set condition type to less than or equal to
    jobForm.handleConditionTypeChange("contract", "less_equal");
    console.log("[AavePosition] Condition type set to: less_equal");

    // Set value to 1.2
    jobForm.handleUpperLimitChange("contract", "1.2");
    console.log("[AavePosition] Upper limit set to: 1.2");

    // Fetch WETH balance for the selected Safe wallet
    let wethBalance = "0";
    const selectedSafeWallet = jobForm.selectedSafeWallet;
    if (selectedSafeWallet) {
      console.log(
        "[AavePosition] Fetching WETH balance for Safe wallet:",
        selectedSafeWallet,
      );
      wethBalance = await fetchWETHBalance(selectedSafeWallet, chainId);
      console.log("[AavePosition] WETH balance fetched:", wethBalance, "ETH");
    } else {
      console.log(
        "[AavePosition] No Safe wallet selected, using MAX_UINT256 as default",
      );
    }

    // Pre-populate two Safe transactions
    const safeTransactions = [
      {
        to: WETH_ADDRESS,
        value: "0",
        data: "0x",
        defaultFunctionSignature: "approve(address,uint256)",
        defaultArgumentValues: [
          AAVE_POOL_ADDRESS,
          wethBalance !== "0" ? wethBalance : MAX_UINT256, // Store in ETH format, will be converted to wei during encoding
        ],
        defaultAbi: JSON.stringify(ERC20Artifact.abi),
      },
      {
        to: AAVE_POOL_ADDRESS,
        value: "0",
        data: "0x",
        defaultFunctionSignature: "supply(address,uint256,address,uint16)",
        defaultArgumentValues: [
          "__TOKEN_TX2_ADDRESS__",
          "0.1", // Default to 0.1 ETH - user enters in ETH, will be converted to wei automatically
          "__CONNECTED_EOA__",
          "0",
        ],
        defaultAbi: JSON.stringify(AavePoolArtifact.abi),
      },
    ];

    console.log("[AavePosition] Safe transactions configured:", {
      transactionCount: safeTransactions.length,
      transactions: safeTransactions.map((tx, idx) => ({
        index: idx,
        to: tx.to,
        function: tx.defaultFunctionSignature,
        args: tx.defaultArgumentValues,
        hasAbi: !!tx.defaultAbi,
      })),
    });

    jobForm.handleSafeTransactionsChange("contract", safeTransactions);
    console.log("[AavePosition] Job setup completed!");
  };

  return (
    <Button color="yellow" onClick={handleCreateJob}>
      Create Job
    </Button>
  );
};

export default AavePosition;
