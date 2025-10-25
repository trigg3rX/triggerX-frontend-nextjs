import React from "react";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";
import { TokenBalance } from "@/utils/fetchTokenBalances";

interface TokenRowProps {
  token: TokenBalance;
  onSendClick: (token: TokenBalance) => void;
}

const TokenRow: React.FC<TokenRowProps> = ({ token, onSendClick }) => {
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex items-center space-x-3">
        {/* Token Icon Placeholder */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Typography
            variant="body"
            color="white"
            className="text-xs font-bold"
          >
            {token.symbol.charAt(0)}
          </Typography>
        </div>

        {/* Token Info */}
        <div>
          <Typography variant="body" color="white" className="font-medium">
            {token.symbol}
          </Typography>
          <Typography variant="body" color="secondary" className="text-sm">
            {token.name}
          </Typography>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Balance */}
        <div className="text-right">
          <Typography variant="body" color="white" className="font-medium">
            {formatBalance(token.balanceFormatted)}
          </Typography>
          <Typography variant="body" color="secondary" className="text-sm">
            {token.symbol}
          </Typography>
        </div>

        {/* Send Button */}
        <Button
          onClick={() => onSendClick(token)}
          disabled={parseFloat(token.balanceFormatted) === 0}
          className="text-sm px-3 py-1"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default TokenRow;
