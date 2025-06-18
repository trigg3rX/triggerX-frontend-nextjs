import React from "react";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";
import { AiFillExclamationCircle } from "react-icons/ai";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";

interface WalletConnectionCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export const WalletConnectionCard: React.FC<WalletConnectionCardProps> = ({
  title = "Wallet Not Connected",
  description = "Please connect your wallet to interact with the contract",
  className = "",
}) => {
  const { isConnected } = useWalletConnectionContext();

  if (isConnected) return null;

  return (
    <Card className={`${className}`}>
      <div className="flex flex-col items-center justify-center gap-4">
        <AiFillExclamationCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
        <Typography variant="h3" align="center" color="secondary">
          {title}
        </Typography>
        <Typography
          variant="body"
          align="center"
          color="secondary"
          className="opacity-70 text-wrap w-[90%] mx-auto"
        >
          {description}
        </Typography>
      </div>
    </Card>
  );
};
