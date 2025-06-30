import { devLog } from "@/lib/devLog";
import { useState } from "react";

export interface ApiKey {
  key: string;
  created: string;
  rateLimit: string;
  status: string;
}

export function useApiKeys(address?: string) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      key: "No API key generated yet",
      created: "-",
      rateLimit: "20 requests/min",
      status: "Inactive",
    },
  ]);

  const generateNewApiKey = async () => {
    try {
      devLog("Generating Api key");
      const user = process.env.NEXT_PUBLIC_USER || process.env.REACT_APP_USER;
      if (!user) {
        console.error("Owner is not defined in environment variables");
        return;
      }
      if (!address) {
        console.error("Wallet address is not available");
        return;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL}/api/${user}/api-keys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            owner: address,
            rateLimit: 20,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const newApiKey: ApiKey = {
        key: data.key || data.apiKey || "",
        created: new Date().toLocaleString(),
        rateLimit: "20 requests/min",
        status: "Active",
      };
      setApiKeys([newApiKey]);
    } catch (error) {
      console.error("Error generating API key:", error);
    }
  };

  return { apiKeys, generateNewApiKey };
}
