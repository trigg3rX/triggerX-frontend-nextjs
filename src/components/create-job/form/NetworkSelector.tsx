import React, { useEffect } from "react";
import { Dropdown } from "../../ui/Dropdown";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import networksData from "@/utils/networks.json";
import { useChainId } from "wagmi";

const networkIcons = Object.fromEntries(
  Object.entries(networksData.networkIcons).map(([name, icon]) => [
    name,
    <svg
      key={name}
      viewBox={icon.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {icon.paths ? (
        icon.paths.map((d, i) => (
          <path
            key={i}
            fillRule="evenodd"
            clipRule="evenodd"
            d={d}
            fill="currentColor"
          />
        ))
      ) : (
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d={icon.path}
          fill="currentColor"
        />
      )}
    </svg>,
  ]),
);

export const NetworkSelector = () => {
  const { selectedNetwork, setSelectedNetwork } = useJobFormContext();
  const chainId = useChainId();

  // Pre-select network from connected wallet's chainId
  useEffect(() => {
    const found = networksData.supportedNetworks.find((n) => n.id === chainId);
    if (found && selectedNetwork !== found.name) {
      setSelectedNetwork(found.name);
    }
    // Only set on mount or when chainId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  return (
    <Dropdown
      label="Network"
      options={networksData.supportedNetworks}
      selectedOption={selectedNetwork}
      onChange={() => {}}
      icons={networkIcons}
      disabled={true}
    />
  );
};
