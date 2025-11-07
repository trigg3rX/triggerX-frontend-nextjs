import { InputField } from "@/components/ui/InputField";
import { Typography } from "@/components/ui/Typography";

export const BalanceMaintainerTokenTemplate = () => {
  return (
    // <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
    <>
      <Typography
        variant="caption"
        color="white"
        align="left"
        className="mb-4 underline"
      >
        Maintain Minimum ETH Balance for a Wallet Address
      </Typography>
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="block">
            <Typography variant="body" color="secondary" align="left">
              Wallet Address
            </Typography>
          </label>
          <InputField
            value="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            onChange={() => {}}
            placeholder="Enter wallet address"
            readOnly
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="block">
            <Typography variant="body" color="secondary" align="left">
              Minimum Balance (ETH)
            </Typography>
          </label>
          <InputField
            value="0.1"
            onChange={() => {}}
            placeholder="Enter minimum balance"
            type="number"
            readOnly
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="block">
            <Typography variant="body" color="secondary" align="left">
              Top-up Amount (ETH)
            </Typography>
          </label>
          <InputField
            value="0.5"
            onChange={() => {}}
            placeholder="Enter top-up amount"
            type="number"
            readOnly
          />
        </div>
      </div>
    </>
    // </div>
  );
};
