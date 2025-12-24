import React from "react";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";

export const MobileWarning: React.FC = () => {
  return (
    <div className="md:hidden min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md">
        <div className="space-y-6">
          <div className="space-y-3">
            <Typography variant="h2" color="white" align="left">
              Bigger Canvas Needed
            </Typography>
            <div className="h-1 w-16 bg-[#C07AF6] rounded-full"></div>
          </div>

          <div className="space-y-4">
            <Typography
              variant="body"
              color="secondary"
              align="left"
              className="leading-relaxed"
            >
              The magic of visual automation happens best on a wider screen
            </Typography>

            <div className="bg-white/5 border-l-4 border-[#F8FF7C] p-4 rounded">
              <Typography
                variant="body"
                color="yellow"
                className="mb-2 font-semibold"
                align="left"
              >
                Switch to Desktop
              </Typography>
              <Typography variant="body" color="secondary" align="left">
                Use a larger screen for the full Blockly experience
              </Typography>
            </div>

            <Typography
              variant="body"
              color="gray"
              align="left"
              className="leading-relaxed"
            >
              Grab your laptop and start building powerful blockchain
              automations with drag and drop simplicity
            </Typography>
          </div>
        </div>
      </Card>
    </div>
  );
};
