import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { useChainId } from "wagmi";
import { getTriggerGasRegistryAddress } from "@/utils/contractAddresses";

export function useStakeRegistry() {
  const [stakeRegistryAddress, setStakeRegistryAddress] = useState("");
  const [stakeRegistryImplAddress, setStakeRegistryImplAddress] = useState("");
  const [stakeRegistryABI, setStakeRegistryABI] = useState("");
  const chainId = useChainId();

  useEffect(() => {
    const fetchStakeRegistryABI = async () => {
      let currentImplAddress = stakeRegistryImplAddress;
      const triggerGasRegistryAddress = getTriggerGasRegistryAddress(chainId);
      setStakeRegistryAddress(triggerGasRegistryAddress);
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
        currentImplAddress = triggerGasRegistryAddress;
      }
      if (!currentImplAddress || !ethers.isAddress(currentImplAddress)) {
        setStakeRegistryABI("");
        return;
      }
      // Use the utility for ABI fetching
      const abiString = await fetchContractABI(currentImplAddress, chainId);
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
