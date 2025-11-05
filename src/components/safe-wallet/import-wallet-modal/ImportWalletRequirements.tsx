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
      <Typography variant="body" color="secondary" align="left">
        Requirements
      </Typography>

      <div className="grid gap-2">
        {[
          {
            icon: Network,
            title: "Network Compatibility",
            description: "Safe contract must exist on the connected network",
          },
          {
            icon: Shield,
            title: "Ownership Verification",
            description:
              "Connected wallet must be an owner of the Safe contract",
          },
        ].map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#C07AF6] flex items-center justify-center transition-colors">
                <Icon size={16} className="text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <Typography
                  variant="caption"
                  color="primary"
                  align="left"
                  className=""
                >
                  {title}
                </Typography>
                <Typography variant="caption" color="secondary" align="left">
                  {description}
                </Typography>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ImportWalletRequirements;
