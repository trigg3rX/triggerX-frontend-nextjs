"use client";

import React from "react";
import { useAccount } from "wagmi";
import { Button } from "../ui/Button";
import { InputField } from "../ui/InputField";
import { Typography } from "../ui/Typography";
import { useApiKeys } from "@/hooks/useApiKeys";
import { WalletConnectionCard } from "../common/WalletConnectionCard";
import { Card } from "../ui/Card";

const GenerateApi: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { apiKeys, generateNewApiKey } = useApiKeys(address);
  const latestKey = apiKeys[0];

  return (
    <div className="w-full lg:w-[70%] min-h-[350px]">
      <WalletConnectionCard />
      {isConnected && (
        <Card>
          <Typography variant="h2" color="yellow">
            Generate API Key
          </Typography>
          <div className="space-y-4 my-6">
            <div className="w-full flex flex-col justify-between gap-5 my-3">
              <div>
                <InputField
                  type="text"
                  placeholder="No API key generated yet"
                  className="rounded-xl"
                  value={latestKey.key}
                  onChange={() => {}}
                  readOnly
                />
              </div>
              <Button onClick={generateNewApiKey}> Generate New API Key</Button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6">
                <div>
                  <Typography
                    variant="span"
                    color="gray"
                    className="mb-2"
                    align="left"
                  >
                    Created
                  </Typography>
                  <Typography variant="body" color="white" align="left">
                    {latestKey.created}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="span"
                    color="gray"
                    className="mb-2"
                    align="left"
                  >
                    Rate Limit
                  </Typography>
                  <Typography variant="body" color="white" align="left">
                    {latestKey.rateLimit}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="span"
                    color="gray"
                    className="mb-2"
                    align="left"
                  >
                    Status
                  </Typography>
                  <Typography
                    variant="badgeGreen"
                    color={latestKey.status === "Active" ? "success" : "gray"}
                    align="left"
                    className="w-max"
                  >
                    {latestKey.status}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GenerateApi;
