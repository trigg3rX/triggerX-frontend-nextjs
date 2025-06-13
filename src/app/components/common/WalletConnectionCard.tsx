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
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col items-center justify-center gap-4">
        <AiFillExclamationCircle className="w-8 h-8 text-gray-300" />
        <Typography variant="h3" align="center" color="secondary">
          {title}
        </Typography>
        <Typography
          variant="h3"
          align="center"
          color="secondary"
          className="opacity-70"
        >
          {description}
        </Typography>
      </div>
    </Card>
  );
};
