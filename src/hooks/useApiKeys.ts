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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNewApiKey = async () => {
    setError(null);
    setIsLoading(true);
    try {
      devLog("Generating Api key");
      const user = process.env.NEXT_PUBLIC_USER;
      if (!user) {
        setError("Owner is not defined in environment variables");
        setIsLoading(false);
        return;
      }
      if (!address) {
        setError("Wallet address is not available");
        setIsLoading(false);
        return;
      }
      devLog(
        "API URL:",
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${user}/api-keys`,
      );
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${user}/api-keys`,
        {
          method: "POST",
          // headers: {
          //   "Content-Type": "application/json",
          // },
          body: JSON.stringify({
            owner: address,
            rateLimit: 20,
          }),
        },
      );
      if (!response.ok) {
        setError(`HTTP error! status: ${response.status}`);
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      const newApiKey: ApiKey = {
        key: data.key || data.apiKey || "",
        created: new Date().toLocaleString(),
        rateLimit: "20 requests/min",
        status: "Active",
      };
      setApiKeys([newApiKey]);
      setIsLoading(false);
    } catch {
      setError(
        "Whoops! We hit a snag while generating your API key. Please check your connection and give it another shot. 🚀",
      );
      setIsLoading(false);
    }
  };

  return { apiKeys, generateNewApiKey, isLoading, error };
}
