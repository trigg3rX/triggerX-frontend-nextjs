import React from "react";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-background rounded-lg border border-white/10 hover:border-white/20 transition-colors">
      {/* Top row: token info (always) + balance (mobile only) */}
      <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
        <div className="flex items-center space-x-3">
          {/* Token Icon Placeholder or Symbol Icon */}
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
          <div className="flex flex-col items-start">
            <Typography
              variant="caption"
              color="white"
              className="font-bold text-base"
            >
              {token.symbol}
            </Typography>
            <Typography variant="caption" color="secondary" className="text-xs">
              {token.name}
            </Typography>
          </div>
        </div>

        {/* Balance for mobile */}
        <Typography
          variant="badge"
          color="white"
          className="font-semibold text-lg mr-1 sm:hidden"
        >
          {formatBalance(token.balanceFormatted)}
        </Typography>
      </div>

      <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full sm:w-auto">
        {/* Balance for desktop*/}
        <div className="hidden sm:flex flex-col items-center mr-1">
          <Typography
            variant="badge"
            color="white"
            className="font-semibold text-lg mr-1"
          >
            {formatBalance(token.balanceFormatted)}
          </Typography>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 justify-start sm:justify-end">
          <Button
            onClick={() => onSendClick(token)}
            disabled={parseFloat(token.balanceFormatted) === 0}
            className="flex-1"
          >
            Send
          </Button>
          <Button className="flex-1" type="button" color="purple">
            Create Job
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TokenRow;
