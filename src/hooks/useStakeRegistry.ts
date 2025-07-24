import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { useChainId } from "wagmi";

const TRIGGER_GAS_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_TRIGGER_GAS_REGISTRY_ADDRESS;

export function useStakeRegistry() {
  const [stakeRegistryAddress, setStakeRegistryAddress] = useState("");
  const [stakeRegistryImplAddress, setStakeRegistryImplAddress] = useState("");
  const [stakeRegistryABI, setStakeRegistryABI] = useState("");
  const chainId = useChainId();

  useEffect(() => {
    const fetchStakeRegistryABI = async () => {
      let currentImplAddress = stakeRegistryImplAddress;
      setStakeRegistryAddress(TRIGGER_GAS_REGISTRY_ADDRESS || "");
      if (!currentImplAddress) {
        const url =
          "https://raw.githubusercontent.com/trigg3rX/triggerx-contracts/main/contracts/script/output/stake.opsepolia.json";
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const data = await response.json();
          if (data && data.TriggerXStakeRegistry) {
            const implAddress = data.triggerXStakeRegistry.implementation || "";
            setStakeRegistryImplAddress(implAddress);
            currentImplAddress = implAddress;
          }
        } catch {
          // fallback to hardcoded address
        }
      }
      if (!currentImplAddress) {
        currentImplAddress = TRIGGER_GAS_REGISTRY_ADDRESS || "";
      }
      if (!currentImplAddress || !ethers.isAddress(currentImplAddress)) {
        setStakeRegistryABI("");
        return;
      }
      // Use the utility for ABI fetching
      const abiString = await fetchContractABI(currentImplAddress);
      if (abiString) {
        try {
          setStakeRegistryABI(JSON.parse(abiString));
        } catch {
          setStakeRegistryABI("");
        }
      } else {
        setStakeRegistryABI("");
      }
    };
    fetchStakeRegistryABI();
     
  }, [stakeRegistryImplAddress, chainId]);

  return {
    stakeRegistryAddress,
    stakeRegistryImplAddress,
    stakeRegistryABI,
  };
}
