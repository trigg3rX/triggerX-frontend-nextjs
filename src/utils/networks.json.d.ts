declare module "@/utils/networks.json" {
  interface NetworkIcon {
    fill: string | undefined;
    viewBox: string;
    path?: string;
    paths?: string[];
  }

  interface Network {
    id: number;
    name: string;
  }

  interface NetworksData {
    supportedNetworks: Network[];
    networkIcons: Record<string, NetworkIcon>;
  }

  const networksData: NetworksData;
  export default networksData;
}
