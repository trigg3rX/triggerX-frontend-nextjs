"use client";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WalletConnectionProvider } from "@/contexts/WalletConnectionContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { config } from "@/lib/wagmiConfig";
import { useState } from "react";

const customTheme = darkTheme({
  accentColor: "#F8FF7C",
  accentColorForeground: "black",
  borderRadius: "large",
  overlayBlur: "small",
});

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
          <WalletConnectionProvider>
            <WalletProvider>{children}</WalletProvider>
          </WalletConnectionProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
