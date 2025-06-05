'use client';

import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { baseSepolia, optimismSepolia } from 'wagmi/chains';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const myCustomTheme = {
  blurs: {
    modalOverlay: "blur(5px)",
  },
  colors: {
    accentColor: "#F8FF7C",
    accentColorForeground: "black",
    actionButtonBorder: "white",
    actionButtonBorderMobile: "rgba(255, 255, 255, 0.25)",
    actionButtonSecondaryBackground: "rgba(255, 255, 255, 0.25)",
    closeButton: "rgba(224, 232, 255, 0.8)",
    closeButtonBackground: "transparent",
    connectButtonBackground: "#F8FF7C",
    connectButtonBackgroundError: "#FF494A",
    connectButtonInnerBackground: "#F8FF7C",
    connectButtonText: "black",
    connectButtonTextError: "black",
    connectionIndicator: "#F8FF7C",
    downloadBottomCardBackground:
      "linear-gradient(126deg, rgba(0, 0, 0, 0.3) 9.49%, rgba(120, 120, 120, 0.4) 71.04%), #1A1B1F",
    downloadTopCardBackground:
      "linear-gradient(126deg, rgba(120, 120, 120, 0.4) 9.49%, rgba(0, 0, 0, 0.3) 71.04%), #1A1B1F",
    error: "#FF494A",
    generalBorder: "rgba(255, 255, 255, 0.25)",
    generalBorderDim: "rgba(255, 255, 255, 0.15)",
    menuItemBackground: "rgba(224, 232, 255, 0.3)",
    modalBackdrop: "rgba(0, 0, 0, 0.7)",
    modalBackground: "#0a0a0a",
    modalBorder: "white",
    modalText: "#FFF",
    modalTextDim: "rgba(224, 232, 255, 0.5)",
    modalTextSecondary: "rgba(255, 255, 255, 0.8)",
    profileAction: "rgba(224, 232, 255, 0.3)",
    profileActionHover: "rgba(224, 232, 255, 0.4)",
    profileForeground:
      "linear-gradient(112.07deg, #161515 26.66%, #252525 87.79%)",
    selectedOptionBorder: "rgba(224, 232, 255, 0.3)",
    standby: "#FFD641",
  },
  fonts: {
    body: "ActayRegular",
  },
  radii: {
    actionButton: "4px",
    connectButton: "50px",
    menuButton: "4px",
    modal: "8px",
    modalMobile: "8px",
  },
  shadows: {
    connectButton: "0px 4px 12px rgba(0, 0, 0, 0.3)",
    dialog: "0px 8px 32px rgba(0, 0, 0, 0.5)",
    profileDetailsAction: "0px 2px 6px rgba(37, 41, 46, 0.2)",
    selectedOption: "0px 2px 6px rgba(0, 0, 0, 0.4)",
    selectedWallet: "0px 2px 6px rgba(0, 0, 0, 0.4)",
    walletLogo: "0px 2px 16px rgba(0, 0, 0, 0.3)",
  },
};

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
        <RainbowKitProvider theme={myCustomTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 