"use client"; 

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface WalletContextType {
  refreshBalance: number;
  triggerBalanceRefresh: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode; 
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [refreshBalance, setRefreshBalance] = useState<number>(0);

  const triggerBalanceRefresh = (): void => {
    setRefreshBalance(prev => prev + 1);
  };

  const contextValue: WalletContextType = {
    refreshBalance,
    triggerBalanceRefresh,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};