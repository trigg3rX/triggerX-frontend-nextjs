import React, { useState } from "react";
import { useChainId, useAccount } from "wagmi";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { useWallet } from "@/contexts/WalletContext";
import Modal from "@/components/ui/Modal";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import ShortAddress from "@/components/ui/ShortAddress";
import { LucideCopyButton } from "@/components/ui/CopyButton";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ClaimModal: React.FC<ClaimModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [claimAmount] = useState("0.03");
  const confettiCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const chainId = useChainId();
  const { address } = useAccount();
  const { triggerBalanceRefresh } = useWallet();
  const [claimFailed, setClaimFailed] = useState(false);

  // Function to get network name based on chain ID
  const getNetworkName = (): string => {
    if (!chainId) return "Unknown Network";
    switch (chainId) {
      case 11155420:
        return "Optimism Sepolia";
      case 84532:
        return "Base Sepolia";
      default:
        return `Chain ${chainId}`;
    }
  };

  // Reset states when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setIsSuccess(false);
      setClaimFailed(false);
    }
  }, [isOpen]);

  // Function to play confetti inside modal
  const playModalConfetti = (): void => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const myConfetti = confetti.create(canvas, { resize: true });
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      myConfetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0.6, x: Math.random() },
        colors: ["#FFD700", "#FFA500", "#F8FF7C"],
        shapes: ["circle"],
        scalar: 1.2,
      });
    }, 250);
  };

  const confirmClaim = async (): Promise<void> => {
    setIsLoading(true);
    setClaimFailed(false);
    try {
      if (!address) {
        toast.error("Wallet not connected. Please connect your wallet first.");
        throw new Error("Wallet not connected");
      }

      const chainIdHex = await window.ethereum.request({
        method: "eth_chainId",
      });

      let networkName = "op_sepolia";
      if (chainIdHex === "0x14a34") {
        networkName = "base_sepolia";
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/claim-fund`,
        {
          method: "POST",
          body: JSON.stringify({
            wallet_address: address,
            network: networkName,
          }),
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        setClaimFailed(true);
        throw new Error(errorData.message || "Failed to claim ETH");
      }
      setIsLoading(false);
      setIsSuccess(true);
      setClaimFailed(false);
      playModalConfetti();
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 1000);
    } catch (error: unknown) {
      setIsLoading(false);
      setClaimFailed(true);
      console.error("Claim error:", error);
      let message = "Failed to claim ETH";
      function hasMessage(e: unknown): e is { message: string } {
        return (
          typeof e === "object" &&
          e !== null &&
          "message" in e &&
          typeof (e as { message: unknown }).message === "string"
        );
      }
      if (hasMessage(error)) {
        message = error.message;
      }
      if (
        typeof message === "string" &&
        (message.includes("rejected") || message.includes("denied"))
      ) {
        toast.error("Transaction was rejected");
      } else {
        toast.error(message);
      }
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={!isLoading ? onClose : () => {}}>
      {/* Confetti canvas overlay */}
      <canvas
        ref={confettiCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center text-center h-full py-4 sm:py-8 z-20 relative">
          <Typography variant="h2" className="mb-4 sm:mb-6 text-white">
            Woohoo!
          </Typography>
          <Typography variant="h3" className="mb-4 sm:mb-6 text-[#F8FF7C]">
            You claimed successfully!
          </Typography>
          <Typography variant="body" className="mb-4 sm:mb-6">
            <span className="text-green-400">
              <b>{claimAmount} ETH</b>
            </span>{" "}
            has been added to your wallet
          </Typography>
          <Button
            onClick={() => {
              triggerBalanceRefresh();
              onClose();
            }}
            color="white"
            className="w-full sm:w-auto mt-4"
          >
            Close
          </Button>
        </div>
      ) : (
        <>
          <Typography variant="h2" align="left" className="mb-4 sm:mb-6">
            Claim ETH
          </Typography>
          <div className="space-y-4 sm:space-y-6 z-20 relative">
            <div className="bg-[#1E1E1E] p-3 sm:p-4 rounded-lg">
              <div className="mb-3 sm:mb-4">
                <Typography variant="h3" color="secondary" align="left">
                  Network
                </Typography>
                <Typography variant="h3" align="left" className="mt-1">
                  {getNetworkName()}
                </Typography>
              </div>
              <div className="mb-3 sm:mb-4">
                <Typography variant="h3" color="secondary" align="left">
                  Your Address
                </Typography>
                <div className="mt-1 flex items-center gap-2">
                  <Typography variant="h3">
                    <ShortAddress address={address} />
                  </Typography>
                  <LucideCopyButton text={address ?? ""} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Typography variant="h3" color="secondary">
                  Claim Amount
                </Typography>
                <Typography variant="h3" className="text-[#F8FF7C]">
                  <b>{claimAmount} ETH</b>
                </Typography>
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 flex flex-row sm:flex-row justify-between gap-3 sm:gap-5">
            <Button
              onClick={onClose}
              disabled={isLoading}
              color="white"
              className="w-full sm:flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmClaim}
              disabled={isLoading}
              color="purple"
              className="w-full sm:flex-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Claiming...
                </span>
              ) : claimFailed ? (
                "Try Again"
              ) : (
                "Claim"
              )}
            </Button>
          </div>
          {claimFailed && (
            <Typography variant="caption" color="secondary" className="mt-4">
              💸 ETH is playing hard to get! Hit Try Again to catch your coins.
            </Typography>
          )}
        </>
      )}
    </Modal>
  );
};

export default ClaimModal;
