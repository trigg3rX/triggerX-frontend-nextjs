import React, { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { ethers, JsonRpcSigner, Log } from "ethers";
import { WalletConnectionCard } from "../../common/WalletConnectionCard";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import TemplateInfoSection from "./components/TemplateInfoSection";
import ClaimEth from "./components/ClaimEth";
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
import { TextInput } from "../../ui/TextInput";
import BalanceMaintainerArtifact from "@/artifacts/BalanceMaintainer.json";
import { LucideCopyButton } from "../../ui/CopyButton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/leaderboard/Table";
import { devLog } from "@/lib/devLog";

// Implementation address for BalanceMaintainer
const BALANCEMAINTAINER_IMPLEMENTATION =
  "0xAc7d9b390B070ab35298e716a11933721480472D";
const FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_TRIGGERXTEMPLATEFACTORY_ADDRESS || "";

const BalanceMaintainer = () => {
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
  const [modalType, setModalType] = useState("");
  const [modalData, setModalData] = useState({
    amount: "0.00",
    networkFee: "$0.00",
    speed: "0 sec",
    contractAddress: "",
    contractMethod: "",
  });
  const [newAddress, setNewAddress] = useState("");
  const [newBalance, setNewBalance] = useState("");
  // const [contractBalance, setContractBalance] = useState<string>("0");
  const [addresses, setAddresses] = useState<
    {
      key: string;
      address: string;
      currentBalance: string;
      minimumBalance: string;
    }[]
  >([]);

  const [error, setError] = useState<string | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  useEffect(() => {
    const initProvider = async () => {
      const win = window as Window &
        typeof globalThis & { ethereum?: ethers.Eip1193Provider };
      if (typeof window !== "undefined" && win.ethereum) {
        try {
          if (isConnected && address) {
            const provider = new ethers.BrowserProvider(
              win.ethereum as ethers.Eip1193Provider,
            );
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();
            setSigner(signer);
            setChainId(network.chainId);
          }
          win.ethereum.on("chainChanged", async () => {
            try {
              const provider = new ethers.BrowserProvider(
                win.ethereum as ethers.Eip1193Provider,
              );
              const newSigner = await provider.getSigner();
              const network = await provider.getNetwork();
              setSigner(newSigner);
              setChainId(network.chainId);
            } catch (error) {
              console.error("Error reinitializing after chain change:", error);
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
        typeof globalThis & { ethereum?: ethers.Eip1193Provider };
      if (typeof window !== "undefined" && win.ethereum) {
        win.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, [isConnected, address]);

  useEffect(() => {
    if (data) {
      const balance = data.value;
      const requiredBalance = ethers.parseEther("0.02");
      const hasBalance = balance >= requiredBalance;
      setHasSufficientBalance(hasBalance);
      if (hasBalance && isCheckingBalance) {
        setIsCheckingBalance(false);
      }
    }
  }, [data, isCheckingBalance]);

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
        BALANCEMAINTAINER_IMPLEMENTATION,
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

  useEffect(() => {
    const doCheck = async () => {
      if (signer && address) {
        const provider = signer.provider as ethers.BrowserProvider;
        await checkExistingContract(provider, address);
      }
    };
    doCheck();
  }, [signer, address]);

  // Show deploy modal
  const showDeployModal = () => {
    setModalType("deploy");
    setModalData({
      amount: "0.02",
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

  // Handle claim success
  const handleClaimSuccess = () => {
    setIsCheckingBalance(true);
  };

  // Add this function before the return statement
  const showAddAddressModal = () => {
    if (!newAddress || !newBalance) return;
    setModalType("addAddress");
    setModalData({
      amount: newBalance,
      networkFee: "$0.01",
      speed: "2 sec",
      contractAddress:
        contractAddress.substring(0, 7) +
        "..." +
        contractAddress.substring(contractAddress.length - 5),
      contractMethod: "setMultipleAddressesWithBalance()",
    });
    setShowModal(true);
  };

  // Confirm modal action
  const handleConfirm = async () => {
    setShowModal(false);
    if (modalType === "deploy") {
      await handleDeploy();
    } else if (modalType === "addAddress") {
      await handleAddAddress();
    }
  };

  // Deploy contract
  const handleDeploy = async () => {
    if (!signer || !address) return;
    setIsLoading(true);
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
        let message = "Unknown error";
        if (
          typeof err === "object" &&
          err &&
          "message" in err &&
          typeof (err as Record<string, unknown>).message === "string"
        ) {
          message = (err as { message: string }).message;
        }
        throw new Error(`Failed to verify factory contract: ${message}`);
      }
      const balance = await signer.provider.getBalance(address);
      const requiredBalance = ethers.parseEther("0.02");
      if (!hasSufficientBalance) {
        throw new Error(
          `Insufficient balance. Required: ${ethers.formatEther(requiredBalance)} ETH, Current: ${ethers.formatEther(balance)} ETH`,
        );
      }
      const tx = await factoryContract.createProxy(
        BALANCEMAINTAINER_IMPLEMENTATION,
        {
          value: ethers.parseEther("0.02"),
        },
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
          // Give the network a brief moment and then fetch data from the new contract
          try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await fetchContractData(signer, proxyAddress);
          } catch {}
        } else {
          throw new Error("Failed to parse deployment event");
        }
      } else {
        throw new Error("No deployment event found in transaction receipt");
      }
    } catch (err: unknown) {
      let code: string | number | undefined, message: string | undefined;
      if (typeof err === "object" && err) {
        if (
          "code" in err &&
          (typeof (err as Record<string, unknown>).code === "string" ||
            typeof (err as Record<string, unknown>).code === "number")
        ) {
          code = (err as { code: string | number }).code;
        }
        if (
          "message" in err &&
          typeof (err as Record<string, unknown>).message === "string"
        ) {
          message = (err as { message: string }).message;
        }
      }
      console.error("Deployment error:", err);
      if (
        code === "ACTION_REJECTED" ||
        code === 4001 ||
        (typeof message === "string" &&
          (message.includes("rejected") ||
            message.includes("denied") ||
            message.includes("user rejected")))
      ) {
        toast.error("Transaction rejected by user");
      } else {
        devLog("Deployment failed: " + (message || "Unknown error"));
        toast.error("Deployment failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add address logic
  const handleAddAddress = async () => {
    if (!signer || !newAddress || !newBalance) return;
    setIsLoading(true);
    setError(null);
    try {
      const contract = new ethers.Contract(
        contractAddress,
        [
          {
            inputs: [],
            name: "maintainBalances",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [
              {
                internalType: "address[]",
                name: "addresses",
                type: "address[]",
              },
              {
                internalType: "uint256[]",
                name: "minBalances",
                type: "uint256[]",
              },
            ],
            name: "setMultipleAddressesWithBalance",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        signer,
      );
      const tx = await contract.setMultipleAddressesWithBalance(
        [newAddress],
        [ethers.parseEther(newBalance)],
      );
      await tx.wait();
      const provider = signer.provider as ethers.BrowserProvider;
      await fetchContractData(provider, contractAddress);
      setNewAddress("");
      setNewBalance("");
      toast.success("Address added successfully!");
      setShowModal(false);
    } catch (error: unknown) {
      let code: string | number | undefined, message: string | undefined;
      if (typeof error === "object" && error) {
        if (
          "code" in error &&
          (typeof (error as Record<string, unknown>).code === "string" ||
            typeof (error as Record<string, unknown>).code === "number")
        ) {
          code = (error as { code: string | number }).code;
        }
        if (
          "message" in error &&
          typeof (error as Record<string, unknown>).message === "string"
        ) {
          message = (error as { message: string }).message;
        }
      }
      setError(message || "Failed to add address");
      console.error("Error adding address:", error);
      if (
        code === "ACTION_REJECTED" ||
        code === 4001 ||
        (typeof message === "string" &&
          (message.includes("rejected") ||
            message.includes("denied") ||
            message.includes("user rejected")))
      ) {
        toast.error("Transaction rejected by user");
      } else {
        devLog("Failed to add address: " + (message || "Unknown error"));
        toast.error("Failed to add address");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch contract data
  const fetchContractData = async (
    signerOrProvider: ethers.BrowserProvider | JsonRpcSigner,
    contractAddr: string,
  ) => {
    if (!signerOrProvider || !contractAddr) return;
    try {
      const provider = (signerOrProvider as JsonRpcSigner).provider
        ? ((signerOrProvider as JsonRpcSigner)
            .provider as ethers.BrowserProvider)
        : (signerOrProvider as ethers.BrowserProvider);
      const code = await provider.getCode(contractAddr);
      if (!code || code === "0x") {
        return;
      }
      // TODO: Replace with actual ABI if available
      const contract = new ethers.Contract(
        contractAddr,
        BalanceMaintainerArtifact.abi,
        signerOrProvider,
      );
      // Get contract balance
      // const balance = await contract.getContractBalance();
      // setContractBalance(Number(ethers.formatEther(balance)).toFixed(4));
      // Get tracked addresses and their minimum balances
      const [addrs, minBalances] =
        await contract.getAllTrackedAddressesWithBalances();
      // Fetch actual balances for each address
      const balancesPromises = addrs.map((addr: string) =>
        provider.getBalance(addr),
      );
      const actualBalances = await Promise.all(balancesPromises);
      setAddresses(
        addrs.map((addr: string, index: number) => ({
          key: index.toString(),
          address: addr,
          currentBalance: Number(
            ethers.formatEther(actualBalances[index]),
          ).toFixed(4),
          minimumBalance: Number(
            ethers.formatEther(minBalances[index]),
          ).toFixed(4),
        })),
      );
    } catch (err) {
      console.error("Error fetching contract data:", err);
    }
  };

  // Periodic contract data refresh
  useEffect(() => {
    if (!signer || !contractAddress || !isDeployed) return;
    const provider = signer.provider as ethers.BrowserProvider;
    fetchContractData(provider, contractAddress);
    const interval = setInterval(() => {
      fetchContractData(provider, contractAddress);
    }, 10000); // 10s
    return () => clearInterval(interval);
  }, [signer, contractAddress, isDeployed]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <TemplateInfoSection
        title="BalanceMaintainer Template"
        description="This template automatically monitors and refills ETH selected addresses when their balance drops below a set threshold."
        steps={[
          "On contract deployment, extra ETH will be held to cover future top-ups when balances dip.",
          "Add the address you want to monitor",
          "Set the minimum balance to maintain (for testnet, keep it below 0.02 ETH)",
          "Confirm the transaction to save your settings",
          "Click on Create Job.",
          "Once set, top-ups happen automatically—no manual checks required.",
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
                    : chainId === BigInt(421614)
                      ? "https://sepolia.arbiscan.io/address/"
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

          <Card>
            <Typography variant="h2" align="left" className="mb-4 sm:mb-6">
              Add Address
            </Typography>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <TextInput
                value={newAddress}
                onChange={setNewAddress}
                placeholder="Enter wallet address"
                type="text"
                error={error && !newAddress ? error : undefined}
              />

              <TextInput
                value={newBalance}
                onChange={setNewBalance}
                placeholder="Min balance"
                type="number"
                error={error && !newBalance ? error : undefined}
              />
              <Button
                color="yellow"
                onClick={showAddAddressModal}
                disabled={isLoading || !newAddress || !newBalance}
                className="h-max"
              >
                {isLoading && modalType === "addAddress"
                  ? "Adding..."
                  : "Add Address"}
              </Button>
            </div>
            {error && <Banner>{error}</Banner>}
          </Card>

          {addresses.length > 0 && (
            <Card>
              <Typography variant="h2" align="left" className="mb-4 sm:mb-6">
                Configured Addresses
              </Typography>
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>Current Balance</TableHead>
                      <TableHead>Min Balance (ETH)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addresses.map((item) => (
                      <TableRow key={item.key} className="bg-[#1A1A1A]">
                        <TableCell className=" text-[#A2A2A2] truncate text-xs">
                          <div className="flex items-center gap-1">
                            <ShortAddress
                              address={item.address}
                              className="text-[#A2A2A2]"
                            />
                            <LucideCopyButton text={item.address} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="py-2 px-3 bg-[#4CAF50] text-white rounded-full text-xs">
                            {item.currentBalance} ETH
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="py-2 px-3 bg-[#C07AF6] text-white rounded-full text-xs">
                            {item.minimumBalance} ETH
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
          {addresses.length === 0 && (
            <Banner>
              No addresses configured yet. Add an address to get started.
            </Banner>
          )}

          <div className="flex justify-center mt-4 sm:mt-6">
            <CreateJobButton contractAddress={contractAddress} />
          </div>
        </>
      )}

      {isConnected && !isDeployed && (
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {!hasSufficientBalance && !isCheckingBalance && (
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
            isLoading={isLoading && modalType === "deploy"}
            disabled={!hasSufficientBalance || isCheckingBalance}
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
        onConfirm={handleConfirm}
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
        jobForm.setJobTitle("Balance Maintainer Job");
        jobForm.setTimeframe({ days: 0, hours: 0, minutes: 1 });
        jobForm.setTimeInterval({ hours: 0, minutes: 0, seconds: 40 });

        const abiString = JSON.stringify([
          {
            inputs: [],
            name: "maintainBalances",
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
        jobForm.handleFunctionChange("contract", "maintainBalances()");

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

export default BalanceMaintainer;
