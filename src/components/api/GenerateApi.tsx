"use client";

import React from "react";
import { useAccount } from "wagmi";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";
import { useApiKeys } from "@/hooks/useApiKeys";
import { WalletConnectionCard } from "../common/WalletConnectionCard";
import { Card } from "../ui/Card";
import { InputField } from "../ui/InputField";
import Banner from "../ui/Banner";

const GenerateApi: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { apiKeys, generateNewApiKey, isLoading, error } = useApiKeys(address);
  const latestKey = apiKeys[0];

  const handleGenerateApiKey = async () => {
    await generateNewApiKey();
  };

  return (
    <div className="w-full lg:w-[65%]">
      <WalletConnectionCard />
      {isConnected && (
        <Card>
          <Typography variant="h2" color="yellow">
            Generate API Key
          </Typography>
          <div className="w-full flex flex-col gap-5 mt-5">
            {latestKey.key !== "No API key generated yet" ? (
              <InputField
                type="text"
                placeholder="No API key generated yet"
                className="rounded-xl"
                value={latestKey.key}
                onChange={() => {}}
                readOnly
              />
            ) : (
              <Banner>No API key generated yet</Banner>
            )}
            {latestKey.key === "No API key generated yet" && (
              <Button
                onClick={handleGenerateApiKey}
                className="w-max mx-auto min-w-[200px]"
                disabled={isLoading}
              >
                {isLoading
                  ? "Generating..."
                  : error
                    ? "Try Again"
                    : "Generate New API Key"}
              </Button>
            )}
            {error && (
              <Typography variant="caption" color="secondary">
                {error}
              </Typography>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-10">
              {[
                { label: "Created", value: latestKey.created },
                { label: "Rate Limit", value: latestKey.rateLimit },
              ].map((detail) => (
                <div
                  key={detail.label}
                  className="flex sm:flex-col gap-2 items-start"
                >
                  <Typography
                    variant="body"
                    color="secondary"
                    className="mb-2"
                    align="left"
                  >
                    {detail.label} :
                  </Typography>
                  <Typography variant="body" color="white" align="left">
                    {detail.value}
                  </Typography>
                </div>
              ))}
              <div className="flex gap-3 items-center">
                <Typography variant="body" color="secondary" align="left">
                  Status :
                </Typography>
                <Typography
                  variant="badge"
                  bgColor="bg-green-500/20"
                  align="left"
                  className="w-max py-1"
                >
                  {latestKey.status}
                </Typography>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GenerateApi;
