import { devLog } from "@/lib/devLog";
import { useState, useEffect } from "react";

export interface ApiKey {
  key: string;
  created: string;
  rateLimit: string;
  status: string;
}

// Add this type for the raw API response
interface ApiKeyResponse {
  key?: string;
  apiKey?: string;
  created?: string;
  rate_limit?: number;
  rateLimit?: number;
  status?: string;
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
  const [isFetching, setIsFetching] = useState(false); // <-- new state
  const [isLoading, setIsLoading] = useState(false); // for generating
  const [isDeleting, setIsDeleting] = useState(false); // for deleting
  const [fetchError, setFetchError] = useState<string | null>(null); // <-- new error state
  const [generateError, setGenerateError] = useState<string | null>(null); // <-- new error state
  const [deleteError, setDeleteError] = useState<string | null>(null); // <-- new error state

  const fetchApiKeys = async (addr?: string) => {
    console.log("[fetchApiKeys] called with address:", addr);
    if (!addr) return;
    setIsFetching(true); // <-- set fetching
    setFetchError(null); // <-- clear fetch error
    try {
      const user = process.env.NEXT_PUBLIC_USER;
      if (!user) {
        setFetchError("Owner is not defined in environment variables");
        setIsFetching(false); // <-- done fetching
        return;
      }
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${user}/api-keys/${addr}`;
      console.log("[fetchApiKeys] GET", url);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
      });
      console.log("[fetchApiKeys] response.ok:", response.ok);
      console.log(
        "[fetchApiKeys] response.ok:",
        response.ok,
        "status:",
        response.status,
      );
      if (!response.ok) {
        setApiKeys([
          {
            key: "No API key generated yet",
            created: "-",
            rateLimit: "20 requests/min",
            status: "Inactive",
          },
        ]);
        setIsFetching(false); // <-- done fetching
        return;
      }
      const data = await response.json();
      console.log("[fetchApiKeys] response data:", data);
      if (Array.isArray(data) && data.length > 0) {
        setApiKeys(
          data.map((item: ApiKeyResponse) => ({
            key: item.key || item.apiKey || "",
            created: item.created || new Date().toLocaleString(),
            rateLimit:
              (item.rate_limit || item.rateLimit || 20) + " requests/min",
            status: item.status || "Active",
          })),
        );
        console.log("[fetchApiKeys] setApiKeys (array):", data);
      } else if (data && (data.key || data.apiKey)) {
        setApiKeys([
          {
            key: data.key || data.apiKey || "",
            created: data.created || new Date().toLocaleString(),
            rateLimit:
              (data.rate_limit || data.rateLimit || 20) + " requests/min",
            status: data.status || "Active",
          },
        ]);
        console.log("[fetchApiKeys] setApiKeys (single):", data);
      } else {
        setApiKeys([
          {
            key: "No API key generated yet",
            created: "-",
            rateLimit: "20 requests/min",
            status: "Inactive",
          },
        ]);
        console.log("[fetchApiKeys] setApiKeys (none)");
      }
      setIsFetching(false); // <-- done fetching
    } catch (err) {
      setFetchError(
        "Whoops! We hit a snag while fetching your API keys. Please check your connection and try again.",
      );
      setIsFetching(false); // <-- done fetching
      console.error("[fetchApiKeys] error:", err);
    }
  };

  const generateNewApiKey = async () => {
    setGenerateError(null); // <-- clear generate error
    setIsLoading(true); // <-- generating
    try {
      devLog("Generating Api key");
      const user = process.env.NEXT_PUBLIC_USER;
      if (!user) {
        setGenerateError("Owner is not defined in environment variables");
        setIsLoading(false); // <-- done generating
        return;
      }
      if (!address) {
        setGenerateError("Wallet address is not available");
        setIsLoading(false); // <-- done generating
        return;
      }
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${user}/api-keys`;
      console.log("[generateNewApiKey] POST", url);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({
          owner: address,
          rate_limit: 20,
        }),
      });
      console.log("[generateNewApiKey] response.ok:", response.ok);
      if (!response.ok) {
        setGenerateError(`HTTP error! status: ${response.status}`);
        setIsLoading(false); // <-- done generating
        return;
      }
      // After generating, refetch all API keys
      await fetchApiKeys(address);
      setIsLoading(false); // <-- done generating
    } catch (err) {
      setGenerateError(
        "Whoops! We hit a snag while generating your API key. Please check your connection and give it another shot. 🚀",
      );
      setIsLoading(false); // <-- done generating
      console.error("[generateNewApiKey] error:", err);
    }
  };

  const deleteApiKey = async (apiKey: string) => {
    setDeleteError(null); // <-- clear delete error
    setIsDeleting(true); // <-- deleting
    try {
      devLog("Deleting Api key");
      const user = process.env.NEXT_PUBLIC_USER;
      if (!user) {
        setDeleteError("Owner is not defined in environment variables");
        setIsDeleting(false);
        return;
      }
      if (!address) {
        setDeleteError("Wallet address is not available");
        setIsDeleting(false);
        return;
      }
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${user}/api-keys/${apiKey}?owner=${address}`;
      console.log("[deleteApiKey] DELETE", url);
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
      });
      console.log("[deleteApiKey] response.ok:", response.ok);
      if (!response.ok) {
        setDeleteError(`HTTP error! status: ${response.status}`);
        setIsDeleting(false);
        return;
      }
      // After deleting, refetch all API keys
      await fetchApiKeys(address);
      setIsDeleting(false);
    } catch (err) {
      setDeleteError(
        "Whoops! We hit a snag while deleting your API key. Please check your connection and try again. 🗑️",
      );
      setIsDeleting(false);
      console.error("[deleteApiKey] error:", err);
    }
  };

  useEffect(() => {
    if (address) {
      fetchApiKeys(address);
    } else {
      setApiKeys([
        {
          key: "No API key generated yet",
          created: "-",
          rateLimit: "20 requests/min",
          status: "Inactive",
        },
      ]);
    }
  }, [address]);

  return {
    apiKeys,
    generateNewApiKey,
    deleteApiKey,
    isLoading,
    isFetching,
    isDeleting,
    fetchError,
    generateError,
    deleteError,
  };
}
