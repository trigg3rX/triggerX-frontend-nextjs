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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${user}/api-keys`,
        {
          method: "POST",
          body: JSON.stringify({
            owner: address,
            rate_limit: 20,
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
      devLog(newApiKey);
      setApiKeys([newApiKey]);
      devLog("apikeys", apiKeys);
      setIsLoading(false);
    } catch {
      setError(
        "Whoops! We hit a snag while generating your API key. Please check your connection and give it another shot. 🚀",
      );
      setIsLoading(false);
    }
  };

  // const fetchApiKey = async (addr?: string) => {
  //   if (!addr) return;
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     const user = process.env.NEXT_PUBLIC_USER;
  //     if (!user) {
  //       setError("Owner is not defined in environment variables");
  //       setIsLoading(false);
  //       return;
  //     }
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${user}/api-keys?owner=${addr}`,
  //       {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
  //         },
  //       }
  //     );
  //     if (!response.ok) {
  //       setApiKeys([
  //         {
  //           key: "No API key generated yet",
  //           created: "-",
  //           rateLimit: "20 requests/min",
  //           status: "Inactive",
  //         },
  //       ]);
  //       setIsLoading(false);
  //       return;
  //     }
  //     const data = await response.json();
  //     if (data && (data.key || data.apiKey)) {
  //       setApiKeys([
  //         {
  //           key: data.key || data.apiKey || "",
  //           created: data.created || new Date().toLocaleString(),
  //           rateLimit: (data.rate_limit || data.rateLimit || 20) + " requests/min",
  //           status: data.status || "Active",
  //         },
  //       ]);
  //     } else {
  //       setApiKeys([
  //         {
  //           key: "No API key generated yet",
  //           created: "-",
  //           rateLimit: "20 requests/min",
  //           status: "Inactive",
  //         },
  //       ]);
  //     }
  //     setIsLoading(false);
  //   } catch {
  //     setError(
  //       "Whoops! We hit a snag while fetching your API key. Please check your connection and try again."
  //     );
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if (address) {
  //     fetchApiKey(address);
  //   } else {
  //     setApiKeys([
  //       {
  //         key: "No API key generated yet",
  //         created: "-",
  //         rateLimit: "20 requests/min",
  //         status: "Inactive",
  //       },
  //     ]);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [address]);

  return { apiKeys, generateNewApiKey, isLoading, error };
}
