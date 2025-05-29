'use client';

import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { baseSepolia, optimismSepolia } from 'wagmi/chains';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { connectors } = getDefaultWallets({
  appName: 'My RainbowKit App',
  projectId: 'f8a6524307e28135845a9fe5811fcaa2',
});

const config = createConfig({
  chains: [baseSepolia, optimismSepolia],
  connectors,
  transports: {
    [baseSepolia.id]: http(),
    [optimismSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

const customTheme = darkTheme({
  accentColor: "#F8FF7C",
  accentColorForeground: "black",
  borderRadius: "large",
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={customTheme}>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 