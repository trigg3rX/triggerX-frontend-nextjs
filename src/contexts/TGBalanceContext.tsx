"use client";
import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ethers } from "ethers";
import { useAccount, useChainId } from "wagmi";
import { devLog } from "@/lib/devLog";
import {
  getTriggerGasRegistryAddress,
  getRpcUrl,
} from "@/utils/contractAddresses";

interface TGBalanceContextType {
  userBalance: string;
  setUserBalance: React.Dispatch<React.SetStateAction<string>>;
  fetchTGBalance: () => Promise<void>;
}

const TGBalanceContext = createContext<TGBalanceContextType | undefined>(
  undefined,
);

export const TGBalanceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [userBalance, setUserBalance] = useState<string>("0");
  const { address } = useAccount();
  const chainId = useChainId();

  const fetchTGBalance = useCallback(async () => {
    devLog("fetchhh");
    if (typeof window.ethereum == "undefined") return;

    // Get the address for the current chain
    const currentStakeRegistryAddress = getTriggerGasRegistryAddress(chainId);
    if (
      !currentStakeRegistryAddress ||
      !ethers.isAddress(currentStakeRegistryAddress)
    ) {
      return;
    }

    // Add 2-second timeout before updating balance
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      if (!window.ethereum) {
        console.warn("No Ethereum provider found. Please install MetaMask.");
        return;
      }
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const signer = await browserProvider.getSigner();
        const userAddress = await signer.getAddress();

        // Get current chain ID and RPC URL
        const network = await browserProvider.getNetwork();
        const chainId = Number(network.chainId);
        const rpcUrl = getRpcUrl(chainId);

        devLog("[TGBalance] Using RPC URL:", rpcUrl);

        // Create JSON RPC provider using the RPC URL
        const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);

        // Use JSON RPC provider for contract interactions
        const stakeRegistryContract = new ethers.Contract(
          currentStakeRegistryAddress,
          ["function getBalance(address) view returns (uint256, uint256)"],
          jsonRpcProvider,
        );
        const [, tgBalance] =
          await stakeRegistryContract.getBalance(userAddress);
        // Store balance in Wei as a string to avoid precision loss
        setUserBalance(tgBalance.toString());
        devLog(
          "[TGBalance] TG Balance (Wei):",
          tgBalance.toString(),
          "Wei",
        );
      }
    } catch (error) {
      console.error("Error fetching TG balance:", error);
    }
  }, [chainId]);

  useEffect(() => {
    const currentStakeRegistryAddress = getTriggerGasRegistryAddress(chainId);
    if (
      currentStakeRegistryAddress &&
      ethers.isAddress(currentStakeRegistryAddress) &&
      address
    ) {
      fetchTGBalance();
    }
    const handleAccountsChanged = (accounts: string[]) => {
      if (
        accounts.length > 0 &&
        currentStakeRegistryAddress &&
        ethers.isAddress(currentStakeRegistryAddress)
      ) {
        fetchTGBalance();
      } else if (accounts.length === 0) {
        setUserBalance("0");
      }
    };
    const handleChainChanged = () => {
      fetchTGBalance();
    };
    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged,
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [chainId, fetchTGBalance, address]);

  return (
    <TGBalanceContext.Provider
      value={{ userBalance, setUserBalance, fetchTGBalance }}
    >
      {children}
    </TGBalanceContext.Provider>
  );
};

export function useTGBalance() {
  const context = useContext(TGBalanceContext);
  if (context === undefined) {
    throw new Error("useTGBalance must be used within a TGBalanceProvider");
  }
  return context;
}
