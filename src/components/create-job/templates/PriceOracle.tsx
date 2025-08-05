import React, { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { ethers, JsonRpcSigner, Log } from "ethers";
import { WalletConnectionCard } from "../../common/WalletConnectionCard";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import TemplateInfoSection from "./components/TemplateInfoSection";
import TransactionModal from "./components/TransactionModal";
import DeployButton from "./components/DeployButton";
import TriggerXTemplateFactory from "@/artifacts/TriggerXTemplateFactory.json";
import { toast } from "react-hot-toast";
import { Typography } from "../../ui/Typography";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import Banner from "../../ui/Banner";
import Link from "next/link";
import ShortAddress from "../../ui/ShortAddress";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { useJob } from "@/contexts/JobContext";
import { devLog } from "@/lib/devLog";
import ClaimEth from "./components/ClaimEth";

// Minimal EIP-1193 type for ethereum provider
interface EthereumProvider {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeAllListeners: (event: string) => void;
}

const FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_TRIGGERXTEMPLATEFACTORY_ADDRESS || "";
const DYNAMICPRICEORACLE_IMPLEMENTATION =
  "0x078858D14418D1eE19743560d80E114CFf3EC837";

const PriceOracle = () => {
  const { address } = useAccount();
  const { isConnected } = useWalletConnectionContext();
  const { data } = useBalance({ address });

  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  const [modalData, setModalData] = useState({
    // amount: "0.00",
    networkFee: "$0.00",
    speed: "0 sec",
    contractAddress: "",
    contractMethod: "",
  });

  useEffect(() => {
    const initProvider = async () => {
      const win = window as Window &
        typeof globalThis & { ethereum?: EthereumProvider };
      if (typeof window !== "undefined" && win.ethereum) {
        try {
          if (isConnected && address) {
            const provider = new ethers.BrowserProvider(
              win.ethereum as unknown as ethers.Eip1193Provider,
            );
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();
            setSigner(signer);
            setChainId(network.chainId);
          }

          win.ethereum.on("chainChanged", async (chainIdHex: string) => {
            try {
              const newChainId = parseInt(chainIdHex, 16);
              setChainId(BigInt(newChainId));
              await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (error) {
              console.error("Error handling chain change:", error);
            }
          });
        } catch (error) {
          console.error("Error initializing provider:", error);
          setSigner(null);
        }
      } else {
        console.error("MetaMask not found");
      }
    };

    initProvider();

    return () => {
      const win = window as Window &
        typeof globalThis & { ethereum?: EthereumProvider };
      if (typeof window !== "undefined" && win.ethereum) {
        win.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, [isConnected, address]);

  useEffect(() => {
    if (data) {
      const balance = data.value;
      const requiredBalance = ethers.parseEther("0.02");
      setHasSufficientBalance(balance >= requiredBalance);
    }
  }, [data]);

  // Handle claim success
  const handleClaimSuccess = () => {
    setIsCheckingBalance(true);
  };

  // Check for existing contract
  const checkExistingContract = async (
    provider: ethers.BrowserProvider,
    userAddress: string,
  ) => {
    if (!provider || !userAddress) return;
    try {
      const factoryContract = new ethers.Contract(
        FACTORY_ADDRESS,
        TriggerXTemplateFactory.abi,
        provider,
      );
      const proxyAddress = await factoryContract.getProxyAddress(
        userAddress,
        DYNAMICPRICEORACLE_IMPLEMENTATION,
      );
      if (proxyAddress && proxyAddress !== ethers.ZeroAddress) {
        const proxyCode = await provider.getCode(proxyAddress);
        if (proxyCode !== "0x") {
          setContractAddress(proxyAddress);
          setIsDeployed(true);
          return;
        }
      }
      setIsDeployed(false);
      setContractAddress("");
    } catch {
      setIsDeployed(false);
      setContractAddress("");
    }
  };

  // Check for existing contract on mount and when signer/address changes
  useEffect(() => {
    const doCheck = async () => {
      if (signer && address) {
        const provider = signer.provider as ethers.BrowserProvider;
        await checkExistingContract(provider, address);
      }
    };
    doCheck();
  }, [signer, address]);

  const showDeployModal = () => {
    setModalData({
      // amount: "0.02",
      networkFee: "$0.01",
      speed: "2 sec",
      contractAddress:
        FACTORY_ADDRESS.substring(0, 7) +
        "..." +
        FACTORY_ADDRESS.substring(FACTORY_ADDRESS.length - 5),
      contractMethod: "createProxy()",
    });
    setShowModal(true);
  };

  const handleDeploy = async () => {
    if (!signer || !address) return;
    setIsLoading(true);
    setShowModal(false);
    setShowModal(false);
    try {
      const network = await signer.provider.getNetwork();
      const currentChainId = network.chainId;

      if (!currentChainId) {
        throw new Error(
          "Unable to determine current network. Please ensure your wallet is connected.",
        );
      }

      const factoryContract = new ethers.Contract(
        FACTORY_ADDRESS,
        TriggerXTemplateFactory.abi,
        signer,
      );

      try {
        const code = await signer.provider.getCode(FACTORY_ADDRESS);
        if (code === "0x") {
          throw new Error(
            `Factory contract not deployed at ${FACTORY_ADDRESS} on current network`,
          );
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        throw new Error(`Failed to verify factory contract: ${error.message}`);
      }

      const balance = await signer.provider.getBalance(address);
      const requiredBalance = ethers.parseEther("0.02");
      if (!hasSufficientBalance) {
        throw new Error(
          `Insufficient balance. Required: ${ethers.formatEther(requiredBalance)} ETH, Current: ${ethers.formatEther(balance)} ETH`,
        );
      }

      const tx = await factoryContract.createProxy(
        DYNAMICPRICEORACLE_IMPLEMENTATION,
      );

      const receipt = await tx.wait();

      const event = receipt.logs.find((log: Log) => {
        try {
          const parsedLog = factoryContract.interface.parseLog(log);
          return parsedLog && parsedLog.name === "ProxyDeployed";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedLog = factoryContract.interface.parseLog(event);
        if (parsedLog) {
          const proxyAddress = parsedLog.args.proxy;
          setContractAddress(proxyAddress);
          setIsDeployed(true);
          toast.success("Contract deployed successfully!");
          setShowModal(false);
        } else {
          throw new Error("Failed to parse deployment event");
        }
      } else {
        throw new Error("No deployment event found in transaction receipt");
      }
    } catch (err: unknown) {
      const error = err as { code?: string | number; message?: string };
      console.error("Deployment error:", error);
      if (
        error.code === "ACTION_REJECTED" ||
        error.code === 4001 ||
        error.message?.includes("rejected") ||
        error.message?.includes("denied") ||
        error.message?.includes("user rejected")
      ) {
        toast.error("Transaction rejected by user");
      } else {
        devLog("Deployment failed: " + (error.message || "Unknown error"));
        toast.error("Deployment failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
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

      {isConnected && isDeployed && (
        <>
          <Card>
            <Typography variant="h2" align="left" className="mb-4 sm:mb-6">
              Contract Information
            </Typography>

            <Typography variant="body" className="py-2" align="left">
              Status :
              <span className="text-[#A2A2A2] pl-2">Deployed Successfully</span>
            </Typography>

            <Typography variant="body" className="py-2" align="left">
              Owner :
              <span className="text-[#A2A2A2] pl-2">
                <span className="hidden sm:inline break-all">{address}</span>
                <span className="sm:hidden">
                  <ShortAddress address={address || undefined} />
                </span>
              </span>
            </Typography>

            <Typography variant="body" className="py-2" align="left">
              Contract Address :
              <Link
                href={`${
                  chainId === BigInt(11155420)
                    ? "https://sepolia-optimism.etherscan.io/address/"
                    : "https://sepolia.basescan.org/address/"
                }${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#77E8A3] underline pl-2 break-all"
              >
                <span className="hidden sm:inline break-all">
                  {contractAddress}
                </span>
                <span className="sm:hidden">
                  <ShortAddress address={contractAddress || undefined} />
                </span>
              </Link>
            </Typography>
          </Card>

          <div className="flex justify-center mt-4 sm:mt-6">
            <CreateJobButton contractAddress={contractAddress} />
          </div>
        </>
      )}

      {isConnected && !isDeployed && (
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {!hasSufficientBalance && (
            <ClaimEth onClaimSuccess={handleClaimSuccess} />
          )}
          {isCheckingBalance && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFF] rounded-full">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              <span className="text-black text-sm">Checking balance...</span>
            </div>
          )}
          <DeployButton
            onClick={showDeployModal}
            isLoading={isLoading}
            disabled={!hasSufficientBalance}
          />
        </div>
      )}
      {isConnected && !isDeployed && hasSufficientBalance && (
        <Banner>You need to deploy contract before create the job.</Banner>
      )}
      {isConnected && !isDeployed && !hasSufficientBalance && (
        <Banner>You need to claim ETH before create the job.</Banner>
      )}
      <TransactionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDeploy}
        modalData={modalData}
      />
    </div>
  );
};

const CreateJobButton: React.FC<{ contractAddress: string }> = ({
  contractAddress,
}) => {
  const jobForm = useJobFormContext();
  const { handleCreateCustomJob } = useJob();

  return (
    <Button
      color="yellow"
      onClick={async () => {
        handleCreateCustomJob();
        jobForm.setJobType(1);
        jobForm.setJobTitle("Test");
        jobForm.setTimeframe({ days: 1, hours: 0, minutes: 0 });
        jobForm.setTimeInterval({ hours: 1, minutes: 0, seconds: 0 });

        const abiString = JSON.stringify([
          {
            inputs: [
              {
                internalType: "uint256",
                name: "_newPrice",
                type: "uint256",
              },
            ],
            name: "updatePrice",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ]);
        jobForm.handleSetContractDetails(
          "contract",
          contractAddress,
          abiString,
        );

        // Wait for state to update
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Validate ABI
        const abiError = jobForm.validateABI("contract");
        jobForm.setContractErrors((prev) => ({
          ...prev,
          contractABI: abiError,
        }));

        // Wait for functions to be available
        await new Promise((resolve) => setTimeout(resolve, 50));
        jobForm.handleFunctionChange("contract", "updatePrice(uint256)");

        jobForm.handleArgumentTypeChange("contract", "dynamic");
        jobForm.handleIpfsCodeUrlChange(
          "contract",
          "https://teal-random-koala-993.mypinata.cloud/ipfs/bafkreiamtrzx3w2wa6s4vs4bbxbhbtwbzuoxoylijjrdy2ezglm6xrdcuu",
        );
      }}
    >
      Create Job
    </Button>
  );
};

export default PriceOracle;
