import React from "react";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Network, Shield } from "lucide-react";

/**
 * @description
 * ImportWalletRequirements component displays the requirements for importing a wallet into the TriggerX.
 * @note Used tailwind classes in typography component to style the text for custom styling.
 * @note Added styling in typography component to style the text for custom styling.
 */
export const ImportWalletRequirements: React.FC = () => {
  return (
    <div className="space-y-4">
      <Typography
        variant="body"
        color="yellow"
        align="center"
        className="uppercase tracking-wider font-bold"
      >
        Requirements
      </Typography>

      <div className="grid gap-2">
        {/* Requirement 1: Network */}
        <Card>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#C07AF6] flex items-center justify-center transition-colors">
              <Network size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <Typography
                variant="caption"
                color="primary"
                className="text-sm font-medium mb-1"
              >
                Network Compatibility
              </Typography>
              <Typography variant="caption" color="secondary">
                Safe contract must exist on the connected network
              </Typography>
            </div>
          </div>
        </Card>

        {/* Requirement 2: Ownership */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#C07AF6] flex items-center justify-center transition-colors">
              <Shield size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <Typography
                variant="caption"
                color="primary"
                className="text-sm font-medium mb-1"
              >
                Ownership Verification
              </Typography>
              <Typography variant="caption" color="secondary">
                Connected wallet must be an owner of the Safe contract
              </Typography>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ImportWalletRequirements;
