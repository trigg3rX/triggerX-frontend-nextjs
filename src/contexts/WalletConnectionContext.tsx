"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAccount } from "wagmi";

interface WalletConnectionContextType {
  isConnected: boolean;
}

const WalletConnectionContext = createContext<
  WalletConnectionContextType | undefined
>(undefined);

interface WalletConnectionProviderProps {
  children: ReactNode;
}

export const WalletConnectionProvider: React.FC<
  WalletConnectionProviderProps
> = ({ children }) => {
  const { isConnected } = useAccount();

  const contextValue: WalletConnectionContextType = {
    isConnected,
  };

  return (
    <WalletConnectionContext.Provider value={contextValue}>
      {children}
    </WalletConnectionContext.Provider>
  );
};

export const useWalletConnectionContext = (): WalletConnectionContextType => {
  const context = useContext(WalletConnectionContext);
  if (context === undefined) {
    throw new Error(
      "useWalletConnectionContext must be used within a WalletConnectionProvider",
    );
  }
  return context;
};
