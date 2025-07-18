import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount, useBalance } from "wagmi";
import { Typography } from "../../ui/Typography";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import Banner from "../../ui/Banner";
import { TextInput } from "../../ui/TextInput";
import TransactionModal from "./components/TransactionModal";
import TemplateInfoSection from "./components/TemplateInfoSection";
import StakingRewardsABI from "@/artifacts/StakingReword.json";
import ERC20ABI from "@/artifacts/ERC20.json";
import { toast } from "react-hot-toast";
import ClaimEth from "./components/ClaimEth";
import { WalletConnectionCard } from "../../common/WalletConnectionCard";
import {
  FaBolt,
  FaDatabase,
  FaRegAddressCard,
  FaCode,
  FaLink,
  FaRegDotCircle,
} from "react-icons/fa";
import ShortAddress from "@/components/ui/ShortAddress";
import { LucideCopyButton } from "@/components/ui/CopyButton";
import { CodeBlockWithCopy } from "@/components/common/CodeBlockWithCopy";
import { devLog } from "@/lib/devLog";

const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_STAKER_TOKEN_ADDRESS;
const STAKE_REWARD_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_STAKING_REWARD_CONTRACT_ADDRESS;
const THRESHOLD = "10";
const jobConfig = {
  jobType: "Event Based (2)",
  argType: "static",
  targetContractAddress: "0xfF97e83B212fC5d536B0bB26d7d8a266C93FF861",
  targetFunction: "distributeNFTRewards",
  triggerContractAddress: "0xfF97e83B212fC5d536B0bB26d7d8a266C93FF861",
  triggerEvent: "ThresholdReached(uint256,uint256)",
  abi: {
    inputs: [],
    name: "distributeNFTRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
};

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeAllListeners: (event: string) => void;
}

const StakingRewards = () => {
  const { address, isConnected } = useAccount();
  const { data: balanceData, refetch: refetchBalance } = useBalance(
    address ? { address } : {},
  );
  const { data: tokenBalanceData, refetch: refetchTokenBalance } = useBalance(
    address && TOKEN_ADDRESS
      ? { address, token: TOKEN_ADDRESS as `0x${string}` }
      : {},
  );
  const { triggerBalanceRefresh } = { triggerBalanceRefresh: () => {} }; // Replace with your wallet context if needed
  const [showModal, setShowModal] = useState(false);
  const [showTokenClaimModal, setShowTokenClaimModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalData, setModalData] = useState({
    amount: "0.00",
    networkFee: "$0.00",
    speed: "0 sec",
    token: "",
    contractAddress: "",
    contractMethod: "",
  });
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const [hasSufficientTokenBalance, setHasSufficientTokenBalance] =
    useState(false);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [stakedAmount, setStakedAmount] = useState("0");
  const [totalStaked, setTotalStaked] = useState("0");
  const [nextThreshold, setNextThreshold] = useState("0");
  const [isClaimingToken, setIsClaimingToken] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [stakingContract, setStakingContract] =
    useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(
    null,
  );
  const [hasNFT, setHasNFT] = useState(false);

  const stakingInfoCards = [
    {
      title: "Your Staked Amount",
      value: `${parseFloat(stakedAmount).toFixed(2)} Tokens`,
      valueClass: "text-[#F8FF7C]",
    },
    {
      title: "Total Staked",
      value: `${parseFloat(totalStaked).toFixed(2)} Tokens`,
      valueClass: "text-[#77E8A3]",
    },
    {
      title: "NFT Reward",
      value: hasNFT ? (
        <span className="text-[#77E8A3]">Received ✓</span>
      ) : (
        <span className="text-[#A2A2A2]">Not Yet</span>
      ),
      valueClass: "",
    },
    {
      title: "Threshold for NFT Reward",
      value: `${THRESHOLD} STK`,
      valueClass: "text-[#77E8A3]",
    },
    {
      title: "Next Threshold for Reward Distribution",
      value: `${parseFloat(nextThreshold).toFixed(2)} Tokens`,
      valueClass: "text-[#77E8A3]",
    },
  ];

  const jobConfigCards = [
    {
      key: "jobType",
      parameter: "Job Type",
      value: jobConfig.jobType,
      icon: <FaBolt className="text-[#F8FF7C] text-lg mr-2" />,
    },
    {
      key: "argType",
      parameter: "Arg Type",
      value: jobConfig.argType,
      icon: <FaDatabase className="text-[#77E8A3] text-lg mr-2" />,
    },
    {
      key: "targetContractAddress",
      parameter: "Target Contract Address",
      value: jobConfig.targetContractAddress,
      isAddress: true,
      icon: <FaRegAddressCard className="text-[#F8FF7C] text-lg mr-2" />,
    },
    {
      key: "targetFunction",
      parameter: "Target Function",
      value: jobConfig.targetFunction,
      icon: <FaCode className="text-[#F8FF7C] text-lg mr-2" />,
    },
    {
      key: "triggerContractAddress",
      parameter: "Trigger Contract Address",
      value: jobConfig.triggerContractAddress,
      isAddress: true,
      icon: <FaLink className="text-[#A259FF] text-lg mr-2" />,
    },
    {
      key: "triggerEvent",
      parameter: "Trigger Event",
      value: jobConfig.triggerEvent,
      icon: <FaRegDotCircle className="text-[#A259FF] text-lg mr-2" />,
    },
  ];

  const handleStake = async () => {
    if (!signer || !address) {
      toast.error("Wallet not connected");
      setIsStaking(false);
      return;
    }
    if (
      !stakeAmount ||
      isNaN(Number(stakeAmount)) ||
      parseFloat(stakeAmount) <= 0
    ) {
      toast.error("Please enter a valid amount to stake");
      setIsStaking(false);
      return;
    }
    if (parseFloat(stakeAmount) > parseFloat(tokenBalance)) {
      toast.error(`You can only stake up to ${tokenBalance} tokens`);
      setIsStaking(false);
      return;
    }
    if (chainId !== BigInt(11155420)) {
      toast.error("Please switch to Optimism Sepolia network");
      setIsStaking(false);
      return;
    }
    setIsStaking(true);
    try {
      if (!STAKE_REWARD_CONTRACT_ADDRESS)
        throw new Error("Staking contract address not set");
      const stakingContract = new ethers.Contract(
        STAKE_REWARD_CONTRACT_ADDRESS,
        StakingRewardsABI.abi,
        signer,
      );
      const approved = await approveTokens(stakeAmount);
      if (!approved) {
        setIsStaking(false);
        return;
      }
      const amount = ethers.parseEther(stakeAmount);
      const tx = await stakingContract.stake(amount);
      await tx.wait();
      setStakeAmount("");
      await refetchTokenBalance();
      await refreshStakingData();
    } catch (err: unknown) {
      let errorMessage = (err as { reason?: string }).reason || "Unknown error";
      if (
        typeof errorMessage === "string" &&
        errorMessage.includes("rejected")
      ) {
        errorMessage = "Transaction rejected by user";
      } else if ((err as { code?: string }).code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient gas funds";
      }
      devLog(errorMessage);
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!signer || !address) {
      toast.error("Wallet not connected");
      setIsUnstaking(false);
      return;
    }
    if (
      !unstakeAmount ||
      isNaN(Number(unstakeAmount)) ||
      parseFloat(unstakeAmount) <= 0
    ) {
      toast.error("Please enter a valid amount to unstake");
      setIsUnstaking(false);
      return;
    }
    if (parseFloat(unstakeAmount) > parseFloat(stakedAmount)) {
      toast.error(`You can only unstake up to ${stakedAmount} tokens`);
      setIsUnstaking(false);
      return;
    }
    if (chainId !== BigInt(11155420)) {
      toast.error("Please switch to Optimism Sepolia network");
      setIsUnstaking(false);
      return;
    }
    setIsUnstaking(true);
    try {
      if (!STAKE_REWARD_CONTRACT_ADDRESS)
        throw new Error("Staking contract address not set");
      const stakingContract = new ethers.Contract(
        STAKE_REWARD_CONTRACT_ADDRESS,
        StakingRewardsABI.abi,
        signer,
      );
      const amount = ethers.parseEther(unstakeAmount);
      const tx = await stakingContract.unstake(amount);
      await tx.wait();
      setUnstakeAmount("");
      await refetchTokenBalance();
      await refreshStakingData();
    } catch (err: unknown) {
      let errorMessage = (err as { reason?: string }).reason || "Unknown error";
      if (
        typeof errorMessage === "string" &&
        errorMessage.includes("rejected")
      ) {
        errorMessage = "Transaction rejected by user";
      } else if ((err as { code?: string }).code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient gas funds";
      }
      devLog(errorMessage);
    } finally {
      setIsUnstaking(false);
    }
  };

  const stakeUnstakeCards = [
    {
      title: "Stake Tokens",
      inputValue: stakeAmount,
      onInputChange: setStakeAmount,
      inputPlaceholder: "Amount to stake",
      inputType: "number" as const,
      button: {
        color: "yellow" as const,
        onClick: handleStake,
        disabled:
          !isInitialized ||
          isStaking ||
          !stakeAmount ||
          !hasSufficientTokenBalance ||
          !hasSufficientBalance,
        text: isApproving ? "Approving..." : isStaking ? "Staking..." : "Stake",
      },
      info: (
        <>
          Available: <span className="text-[#F8FF7C]">{tokenBalance} STK</span>
        </>
      ),
    },
    {
      title: "Unstake Tokens",
      inputValue: unstakeAmount,
      onInputChange: setUnstakeAmount,
      inputPlaceholder: "Amount to unstake",
      inputType: "number" as const,
      button: {
        color: "white" as const,
        onClick: handleUnstake,
        disabled:
          !isInitialized ||
          isUnstaking ||
          !hasSufficientBalance ||
          !unstakeAmount ||
          parseFloat(stakedAmount) <= 0 ||
          parseFloat(unstakeAmount) > parseFloat(stakedAmount),
        text: isUnstaking ? "Unstaking..." : "Unstake",
      },
      info: (
        <>
          Staked: <span className="text-[#F8FF7C]">{stakedAmount} STK</span>
        </>
      ),
    },
  ];

  useEffect(() => {
    const refetchBalances = async () => {
      await Promise.all([refetchBalance(), refetchTokenBalance()]);
    };
    refetchBalances();
  }, [triggerBalanceRefresh, refetchBalance, refetchTokenBalance, address]);

  useEffect(() => {
    if (balanceData && tokenBalanceData) {
      const balance = balanceData.value;
      const tokenBalance = tokenBalanceData.value;
      const requiredBalance = ethers.parseEther("0.02");
      const requiredTokenBalance = ethers.parseEther("1");
      setTokenBalance(Number(ethers.formatEther(tokenBalance)).toFixed(2));
      setHasSufficientBalance(balance >= requiredBalance);
      setHasSufficientTokenBalance(tokenBalance >= requiredTokenBalance);
    }
  }, [balanceData, tokenBalanceData]);

  useEffect(() => {
    if (signer && address) {
      try {
        if (STAKE_REWARD_CONTRACT_ADDRESS && TOKEN_ADDRESS && signer) {
          const stakingContract = new ethers.Contract(
            STAKE_REWARD_CONTRACT_ADDRESS,
            StakingRewardsABI.abi,
            signer,
          );
          const tokenContract = new ethers.Contract(
            TOKEN_ADDRESS,
            ERC20ABI.abi,
            signer,
          );
          setStakingContract(stakingContract);
          setTokenContract(tokenContract);
          fetchStakingData(stakingContract, address);
        }
      } catch (error) {
        console.error("Error initializing contracts:", error);
      }
    }
  }, [signer, address]);

  useEffect(() => {
    if (!stakingContract || !address) return;
    const interval = setInterval(() => {
      fetchStakingData(stakingContract, address);
    }, 30000);
    return () => clearInterval(interval);
  }, [stakingContract, address]);

  useEffect(() => {
    const initProvider = async () => {
      if (
        typeof window !== "undefined" &&
        (window as { ethereum?: EthereumProvider }).ethereum
      ) {
        try {
          if (isConnected && address) {
            const provider = new ethers.BrowserProvider(
              (window as { ethereum: EthereumProvider }).ethereum,
            );
            const signer = await provider.getSigner();
            let network;
            try {
              network = await provider.getNetwork();
            } catch {
              network = { chainId: 11155420 };
            }
            setSigner(signer);
            setChainId(BigInt(network.chainId));
            setIsInitialized(true);
          } else {
            setIsInitialized(true);
          }
          (window as { ethereum: EthereumProvider }).ethereum.on(
            "chainChanged",
            (chainIdHex: unknown) => {
              try {
                if (typeof chainIdHex === "string") {
                  const newChainId = BigInt(parseInt(chainIdHex, 16));
                  setChainId(newChainId);
                }
                setTimeout(() => {}, 1000);
              } catch (err) {
                console.error("Error handling chain change:", err);
              }
            },
          );
        } catch {
          setSigner(null);
          setChainId(null);
          setIsInitialized(false);
        }
      } else {
        setIsInitialized(false);
      }
    };
    initProvider();
    return () => {
      if (
        typeof window !== "undefined" &&
        (window as { ethereum?: EthereumProvider }).ethereum
      ) {
        (window as { ethereum: EthereumProvider }).ethereum.removeAllListeners(
          "chainChanged",
        );
      }
    };
  }, [isConnected, address]);

  const fetchStakingData = async (
    contract: ethers.Contract,
    userAddress: string,
  ) => {
    if (!contract || !userAddress) return;
    try {
      const userStaked = await contract.getStakedAmount(userAddress);
      setStakedAmount(ethers.formatEther(userStaked));
      const total = await contract.getTotalStaked();
      setTotalStaked(ethers.formatEther(total));
      const hasReceivedNFT = await contract.hasReceivedNFT(userAddress);
      setHasNFT(hasReceivedNFT);
      const modulusThreshold =
        Number(ethers.formatEther(total)) % Number(THRESHOLD);
      const nextThreshold = Number(THRESHOLD) - modulusThreshold;
      setNextThreshold(nextThreshold.toString());
    } catch (err) {
      console.error("Error fetching staking data:", err);
    }
  };

  const refreshStakingData = async () => {
    if (stakingContract && address) {
      await fetchStakingData(stakingContract, address);
    }
  };

  const showStakeTokenClaimModal = () => {
    setModalType("claimToken");
    setModalData({
      amount: "1.0",
      networkFee: "~0.005 $",
      speed: "2 sec",
      token: "STK",
      contractAddress:
        TOKEN_ADDRESS?.substring(0, 7) +
        "..." +
        TOKEN_ADDRESS?.substring(TOKEN_ADDRESS.length - 5),
      contractMethod: "mint()",
    });
    setShowTokenClaimModal(true);
  };

  const handleConfirm = async () => {
    setShowTokenClaimModal(false);
    if (modalType === "claimToken") {
      handleTokenClaim();
    }
  };

  const handleTokenClaim = async () => {
    if (!signer || !address || chainId !== BigInt(11155420)) {
      toast.error("Please connect to Optimism Sepolia network");
      return;
    }
    setIsClaimingToken(true);
    try {
      if (!tokenContract) throw new Error("Token contract not initialized");
      const tx = await tokenContract.mint(address, ethers.parseEther("1.0"));
      await tx.wait();
      await refetchTokenBalance();

      toast.success("Token claimed successfully!");
    } catch (err: unknown) {
      const message = (err as { message?: string }).message || "Unknown error";
      if (typeof message === "string" && message.includes("rejected")) {
        toast.error("Transaction was rejected");
      } else {
        devLog(message);
      }
    } finally {
      setShowTokenClaimModal(false);
      setIsClaimingToken(false);
    }
  };

  const approveTokens = async (amount: string) => {
    if (!signer || !address || !TOKEN_ADDRESS) return false;
    try {
      setIsApproving(true);
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        ERC20ABI.abi,
        signer,
      );
      const approvalAmount = ethers.parseEther(amount);
      const allowance = await tokenContract.allowance(
        address,
        STAKE_REWARD_CONTRACT_ADDRESS,
      );
      if (allowance < approvalAmount) {
        const tx = await tokenContract.approve(
          STAKE_REWARD_CONTRACT_ADDRESS,
          ethers.parseEther("1000000"),
        );
        await tx.wait();
        toast.success("Token approval successful!");
        return true;
      }
      return true;
    } catch (err: unknown) {
      const message = (err as { message?: string }).message || "Unknown error";
      if (typeof message === "string" && message.includes("rejected")) {
        toast.error("Approval rejected by user");
      } else {
        devLog("Failed to approve tokens: " + message);
      }
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  const isOptimismSepoliaNetwork = () => chainId === BigInt(11155420);

  return (
    <div className="space-y-6 sm:space-y-8">
      <TemplateInfoSection
        title="StakingReward Template"
        description="Stake ERC20 tokens and earn rewards based on your participation. Once the staking threshold is reached, you'll automatically receive Reward NFTs and points. No manual setup required—the job will be auto-created for you."
        steps={[
          "Claim Tokens - Click to receive ERC20 tokens.",
          "Choose Action - Select 'Stake' or 'Unstake.'",
          "Stake - Enter amount to lock tokens.",
          "Unstake - Only if you've staked before.",
          "Job Auto-Created - TriggerX creates the job based on your stake status.",
          "Earn Rewards - Receive NFTs + points once the threshold is met.",
        ]}
      />
      <WalletConnectionCard className="mt-4" />

      {isConnected && chainId !== null && !isOptimismSepoliaNetwork() && (
        <Banner>
          Please switch to Optimism Sepolia network to claim tokens.
        </Banner>
      )}

      {isConnected && hasSufficientBalance
        ? !hasSufficientTokenBalance && (
            <Button color="purple" onClick={showStakeTokenClaimModal}>
              {isClaimingToken ? "Claiming..." : "Claim Token"}
            </Button>
          )
        : isConnected && <ClaimEth />}

      {isConnected && hasSufficientBalance && !hasSufficientTokenBalance && (
        <Banner>You need to claim tokens before staking them.</Banner>
      )}
      {isConnected && !hasSufficientBalance && (
        <Banner>You need to claim ETH before Stake/Unstake Tokens.</Banner>
      )}

      {isConnected && (
        <>
          {stakingContract && (
            <Card className="!p-3 !sm:p-6">
              <Typography variant="h2" align="left" className="mb-6">
                Staking Reward Information
              </Typography>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {stakingInfoCards.map((item) => (
                  <Card variant="soft" key={item.title}>
                    <Typography
                      variant="h3"
                      align="left"
                      className="mb-3 text-wrap"
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="h3"
                      align="left"
                      className={`text-wrap ${item.valueClass}`.trim()}
                    >
                      {item.value}
                    </Typography>
                  </Card>
                ))}
              </div>

              <Card className="my-4 !p-3 !sm:p-6" variant="soft">
                <Typography variant="h2" align="left" className="mb-6">
                  Stake/Unstake Tokens
                </Typography>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-6">
                  {stakeUnstakeCards.map((item) => (
                    <Card
                      className="space-y-3 sm:space-y-4 !p-3 !sm:p-6"
                      key={item.title}
                    >
                      <Typography variant="h3" align="left">
                        {item.title}
                      </Typography>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="w-full sm:w-[80%] text-wrap break-all">
                          <TextInput
                            value={item.inputValue}
                            onChange={item.onInputChange}
                            placeholder={item.inputPlaceholder}
                            type={item.inputType}
                          />
                        </div>
                        <Button
                          color={item.button.color}
                          onClick={item.button.onClick}
                          disabled={item.button.disabled}
                        >
                          {item.button.text}
                        </Button>
                      </div>
                      <Typography
                        variant="body"
                        color="secondary"
                        align="left"
                        className="flex items-center gap-2"
                      >
                        {item.info}
                      </Typography>
                    </Card>
                  ))}
                </div>
              </Card>
              <Card variant="soft" className="!p-3 !sm:p-6">
                <Typography variant="h2" align="left" className="mb-6">
                  Job Configuration
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 text-base sm:text-lg ">
                  {jobConfigCards.map((item) => (
                    <Card key={item.key} className="!p-3 !sm:p-6">
                      <div className="flex items-center mb-2 sm:mb-3">
                        {item.icon}
                        <Typography variant="h4" align="left" className="ml-2">
                          {item.parameter}
                        </Typography>
                      </div>

                      {item.isAddress ? (
                        <div className="flex flex-col space-y-2">
                          <Card
                            variant="soft"
                            className="flex items-center justify-between !p-3 !sm:p-6"
                          >
                            <Typography variant="body" noWrap={true}>
                              <ShortAddress
                                address={item.value}
                                className="text-[#A2A2A2]"
                              />
                            </Typography>
                            <LucideCopyButton text={item.value} />
                          </Card>
                        </div>
                      ) : (
                        <Card variant="soft" className="!p-3 !sm:p-6">
                          <Typography
                            variant="body"
                            align="left"
                            noWrap={true}
                            className="!break-all !text-wrap"
                          >
                            {item.value}
                          </Typography>
                        </Card>
                      )}
                    </Card>
                  ))}

                  <Card className="md:col-span-2 !p-3 !sm:p-6">
                    <Typography variant="h3" align="left">
                      Contract ABI
                    </Typography>

                    <Typography variant="body" align="left" className="mb-3">
                      The interface for the contract&apos;s distributeNFTRewards
                      function
                    </Typography>

                    <CodeBlockWithCopy
                      code={JSON.stringify(jobConfig.abi, null, 2)}
                    />
                  </Card>
                </div>
              </Card>
            </Card>
          )}
        </>
      )}

      <TransactionModal
        isOpen={showModal || showTokenClaimModal}
        onClose={() => {
          setShowModal(false);
          setShowTokenClaimModal(false);
        }}
        onConfirm={handleConfirm}
        modalType={modalType}
        modalData={modalData}
      />
    </div>
  );
};

export default StakingRewards;
