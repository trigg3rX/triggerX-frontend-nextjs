"use client";
import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { devLog } from "@/lib/devLog";

interface TGBalanceContextType {
  userBalance: string;
  setUserBalance: React.Dispatch<React.SetStateAction<string>>;
  fetchTGBalance: () => Promise<void>;
}

const TGBalanceContext = createContext<TGBalanceContextType | undefined>(
  undefined,
);

export const TGBalanceProvider: React.FC<{
  stakeRegistryAddress: string;
  children: React.ReactNode;
}> = ({ stakeRegistryAddress, children }) => {
  const [userBalance, setUserBalance] = useState<string>("0");
  const { address } = useAccount();

  const fetchTGBalance = useCallback(async () => {
    if (typeof window.ethereum == "undefined") return;
    if (!stakeRegistryAddress || !ethers.isAddress(stakeRegistryAddress)) {
      return;
    }
    try {
      if (!window.ethereum) {
        console.warn("No Ethereum provider found. Please install MetaMask.");
        return;
      }
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const stakeRegistryContract = new ethers.Contract(
          stakeRegistryAddress,
          ["function getBalance(address) view returns (uint256, uint256)"],
          provider,
        );
        const [, tgBalance] =
          await stakeRegistryContract.getBalance(userAddress);
        setUserBalance(ethers.formatEther(tgBalance));
        devLog(
          "[TGBalance] TG Balance after chain change:",
          ethers.formatEther(tgBalance),
        );
      }
    } catch (error) {
      console.error("Error fetching TG balance:", error);
    }
  }, [stakeRegistryAddress]);

  useEffect(() => {
    if (
      stakeRegistryAddress &&
      ethers.isAddress(stakeRegistryAddress) &&
      address
    ) {
      fetchTGBalance();
    }
    const handleAccountsChanged = (accounts: string[]) => {
      if (
        accounts.length > 0 &&
        stakeRegistryAddress &&
        ethers.isAddress(stakeRegistryAddress)
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
  }, [stakeRegistryAddress, fetchTGBalance, address]);

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
