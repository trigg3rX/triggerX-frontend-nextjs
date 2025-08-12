"use client";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WalletConnectionProvider } from "@/contexts/WalletConnectionContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { config } from "@/lib/wagmiConfig";
import { useState } from "react";
import { useStakeRegistry } from "@/hooks/useStakeRegistry";
import { TGBalanceProvider } from "@/contexts/TGBalanceContext";

const customTheme = darkTheme({
  accentColor: "#F8FF7C",
  accentColorForeground: "black",
  borderRadius: "large",
  overlayBlur: "small",
});

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { stakeRegistryAddress } = useStakeRegistry();
  if (!stakeRegistryAddress) return null; // or a loading spinner

  return (
    <TGBalanceProvider>
      <WalletConnectionProvider>
        <WalletProvider>{children}</WalletProvider>
      </WalletConnectionProvider>
    </TGBalanceProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside the component to prevent re-initialization
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={customTheme}>
          <InnerProviders>{children}</InnerProviders>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
