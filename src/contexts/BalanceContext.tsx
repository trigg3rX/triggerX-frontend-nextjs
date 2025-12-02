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

interface BalanceContextType {
  userBalance: string;
  setUserBalance: React.Dispatch<React.SetStateAction<string>>;
  fetchBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [userBalance, setUserBalance] = useState<string>("0");
  const { address } = useAccount();
  const chainId = useChainId();

  const fetchBalance = useCallback(async () => {
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

        devLog("[Balance] Using RPC URL:", rpcUrl);

        // Create JSON RPC provider using the RPC URL
        const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);

        // Use JSON RPC provider for contract interactions
        const stakeRegistryContract = new ethers.Contract(
          currentStakeRegistryAddress,
          ["function getBalance(address) view returns (uint256)"],
          jsonRpcProvider,
        );
        const ethAmount = await stakeRegistryContract.getBalance(userAddress);
        setUserBalance(ethers.formatEther(ethAmount));
        devLog(
          "[Balance] Balance after chain change:",
          ethers.formatEther(ethAmount),
        );
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, [chainId]);

  useEffect(() => {
    const currentStakeRegistryAddress = getTriggerGasRegistryAddress(chainId);
    if (
      currentStakeRegistryAddress &&
      ethers.isAddress(currentStakeRegistryAddress) &&
      address
    ) {
      fetchBalance();
    }
    const handleAccountsChanged = (accounts: string[]) => {
      if (
        accounts.length > 0 &&
        currentStakeRegistryAddress &&
        ethers.isAddress(currentStakeRegistryAddress)
      ) {
        fetchBalance();
      } else if (accounts.length === 0) {
        setUserBalance("0");
      }
    };
    const handleChainChanged = () => {
      fetchBalance();
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
  }, [chainId, fetchBalance, address]);

  return (
    <BalanceContext.Provider
      value={{ userBalance, setUserBalance, fetchBalance }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

export function useTriggerBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error("useTriggerBalance must be used within a BalanceProvider");
  }
  return context;
}
