import React from "react";
import { Dropdown } from "../../ui/Dropdown";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import networksData from "@/utils/networks.json";

const networkIcons = Object.fromEntries(
  Object.entries(networksData.networkIcons).map(([name, icon]) => [
    name,
    <svg
      key={name}
      viewBox={icon.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={icon.path}
        fill="currentColor"
      />
    </svg>,
  ]),
);

export const NetworkSelector = () => {
  const { selectedNetwork, setSelectedNetwork } = useJobFormContext();

  return (
    <Dropdown
      label="Network"
      options={networksData.supportedNetworks}
      selectedOption={selectedNetwork}
      onChange={(option) => setSelectedNetwork(option.name)}
      icons={networkIcons}
    />
  );
};
