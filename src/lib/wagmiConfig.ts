import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { baseSepolia, optimismSepolia } from "wagmi/chains";

const { connectors } = getDefaultWallets({
  appName: "TriggerX",
  projectId: "f8a6524307e28135845a9fe5811fcaa2",
});

export const config = createConfig({
  chains: [baseSepolia, optimismSepolia],
  connectors,
  transports: {
    [baseSepolia.id]: http(),
    [optimismSepolia.id]: http(),
  },
});
