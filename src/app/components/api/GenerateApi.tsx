"use client";

import React from "react";
import { useAccount } from "wagmi";
import WalletNotConnected from "../common/WalletNotConnected";
import { MainContainer } from "../ui/MainContainer";
import { Button } from "../ui/Button";
import { InputField } from "../ui/InputField";
import { Typography } from "../ui/Typography";
import { useApiKeys } from "@/hooks/useApiKeys";
// import { CopyButton } from "../../ui/CopyButton";

const GenerateApi: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { apiKeys, generateNewApiKey } = useApiKeys(address);
  const latestKey = apiKeys[0];

  // For copy feedback

  return (
    <MainContainer className="w-full lg:w-[70%] h-[350px] p-0">
      <div className=" md:p-8  p-6 sm:p-6 ">
        <Typography
          variant="h2"
          color="yellow"
          align="center"
          className="font-bold"
        >
          Generate API Key
        </Typography>
        <div className="space-y-4 my-6">
          {!isConnected ? (
            <WalletNotConnected />
          ) : (
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
                  >
                    {latestKey.status}
                  </Typography>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainContainer>
  );
};

export default GenerateApi;
