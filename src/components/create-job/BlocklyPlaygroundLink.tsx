import React from "react";
import Link from "next/link";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";

export const BlocklyPlaygroundLink: React.FC = () => {
  return (
    <Card className="flex flex-col gap-6">
      <Typography variant="h3" align="left" className="text-white">
        Blockly Playground
      </Typography>

      <div className="space-y-3">
        <Typography variant="body" color="secondary" align="left">
          Build your automation like solving a puzzle. Drag, drop, and create
          powerful on-chain jobs in minutes
        </Typography>
        <Typography variant="body" color="yellow" align="left">
          No code. No confusion. Just connect the blocks
        </Typography>
      </div>

      <Link href="/visual-job-builder">
        <Button color="purple" className="w-full">
          Create Your Workflow
        </Button>
      </Link>
    </Card>
  );
};
