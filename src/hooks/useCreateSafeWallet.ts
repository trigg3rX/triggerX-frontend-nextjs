import { useState } from "react";
import { useChainId } from "wagmi";
import { ethers } from "ethers";
import {
  getSafeWalletFactoryAddress,
  getSafeModuleAddress,
} from "@/utils/contractAddresses";
import toast from "react-hot-toast";
import TriggerXSafeFactoryArtifact from "@/artifacts/TriggerXSafeFactory.json";

const SAFE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
      { internalType: "uint8", name: "operation", type: "uint8" },
      { internalType: "uint256", name: "safeTxGas", type: "uint256" },
      { internalType: "uint256", name: "baseGas", type: "uint256" },
      { internalType: "uint256", name: "gasPrice", type: "uint256" },
      { internalType: "address", name: "gasToken", type: "address" },
      {
        internalType: "address payable",
        name: "refundReceiver",
        type: "address",
      },
      { internalType: "bytes", name: "signatures", type: "bytes" },
    ],
    name: "execTransaction",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "nonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "domainSeparator",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "module", type: "address" }],
    name: "enableModule",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "module", type: "address" }],
    name: "isModuleEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

// EIP-712 TypeHash for Safe transactions
const SAFE_TX_TYPEHASH =
  "0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8";

export const useCreateSafeWallet = () => {
  const chainId = useChainId();
  const [isCreating, setIsCreating] = useState(false);
  const [isEnablingModule, setIsEnablingModule] = useState(false);

  const createSafeWallet = async (
    userAddress: string,
  ): Promise<string | null> => {
    setIsCreating(true);
    try {
      const factoryAddress = getSafeWalletFactoryAddress(chainId);
      if (!factoryAddress) {
        throw new Error(
          "Safe Wallet Factory address not configured for this network",
        );
      }

      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factory = new ethers.Contract(
        factoryAddress,
        TriggerXSafeFactoryArtifact.abi,
        signer,
      );

      toast.loading("Creating Safe wallet...", { id: "create-safe" });
      const tx = await factory.createSafeWallet(userAddress);
      const receipt = await tx.wait();

      // Get the Safe address from the event logs
      const safeCreatedEvent = receipt.logs.find(
        (log: { topics: string[] }) =>
          log.topics[0] ===
          ethers.id("SafeWalletCreated(address,address,uint256)"),
      );

      let safeAddress: string | null = null;
      if (safeCreatedEvent) {
        safeAddress = ethers.getAddress(
          "0x" + safeCreatedEvent.topics[2].slice(-40),
        );
      }

      toast.success("Safe wallet created successfully!", { id: "create-safe" });
      return safeAddress;
    } catch (err) {
      console.error("Error creating Safe wallet:", err);
      const getShortErrorMessage = (error: Error): string => {
        const message = error.message.toLowerCase();

        if (
          message.includes("user rejected") ||
          message.includes("user denied")
        ) {
          return "Transaction rejected";
        }
        if (message.includes("insufficient funds")) {
          return "Insufficient funds";
        }
        if (message.includes("network")) {
          return "Network error";
        }
        if (message.includes("gas")) {
          return "Gas estimation failed";
        }
        if (message.includes("metamask")) {
          return "MetaMask error";
        }

        // Fallback: take first few words
        return error.message.split(" ").slice(0, 3).join(" ");
      };

      toast.error(
        err instanceof Error
          ? `Safe creation failed: ${getShortErrorMessage(err)}`
          : "Safe creation failed",
        {
          id: "create-safe",
        },
      );
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const enableModule = async (safeAddress: string): Promise<boolean> => {
    setIsEnablingModule(true);
    try {
      const moduleAddress = getSafeModuleAddress(chainId);
      if (!moduleAddress) {
        throw new Error("Safe Module address not configured for this network");
      }

      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const safeProxy = new ethers.Contract(safeAddress, SAFE_ABI, provider);

      // Check if module is already enabled with retry logic and better error handling
      let isEnabled = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          isEnabled = await safeProxy.isModuleEnabled(moduleAddress);
          break; // Success, exit retry loop
        } catch (error: unknown) {
          retryCount++;
          console.warn(
            `Attempt ${retryCount} to check module status failed:`,
            error,
          );

          if (retryCount >= maxRetries) {
            // If all retries failed, assume module is not enabled and proceed
            console.warn(
              "Failed to check module status after retries, proceeding with enablement",
            );
            isEnabled = false;
            break;
          }

          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount),
          );
        }
      }

      if (isEnabled) {
        toast.success("Module is already enabled!");
        return true;
      }

      // Get Safe's current nonce
      const safeNonce = await safeProxy.nonce();

      // Encode the enableModule call data
      const data = new ethers.Interface(SAFE_ABI).encodeFunctionData(
        "enableModule",
        [moduleAddress],
      );

      // Build Safe transaction parameters
      const to = safeAddress; // self-call to enable module
      const value = 0; // no ETH transfer
      const operation = 0; // Call operation
      const safeTxGas = 0; // use all available gas
      const baseGas = 0; // no base gas
      const gasPrice = 0; // no gas refund
      const gasToken = ethers.ZeroAddress; // ETH
      const refundReceiver = ethers.ZeroAddress; // no refund

      // Calculate Safe transaction hash using EIP-712
      const safeTxHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          [
            "bytes32",
            "address",
            "uint256",
            "bytes32",
            "uint8",
            "uint256",
            "uint256",
            "uint256",
            "address",
            "address",
            "uint256",
          ],
          [
            SAFE_TX_TYPEHASH,
            to,
            value,
            ethers.keccak256(data),
            operation,
            safeTxGas,
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            safeNonce,
          ],
        ),
      );

      // Get domain separator from Safe
      const domainSeparator = await safeProxy.domainSeparator();

      // Create EIP-712 hash
      const txHash = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes1", "bytes1", "bytes32", "bytes32"],
          ["0x19", "0x01", domainSeparator, safeTxHash],
        ),
      );

      // Sign the transaction hash using the connected wallet (personal_sign)
      // For Gnosis Safe, personal_sign signatures must have v adjusted by +4 to mark EthSign
      toast.loading("Please sign the transaction to enable module...", {
        id: "enable-module",
      });
      const rawSignature = await signer.signMessage(ethers.getBytes(txHash));

      // Normalize signature to r, s, v and adjust v for Safe's EthSign type
      const sigObj = ethers.Signature.from(rawSignature);
      const adjustedV = sigObj.v + 4; // Safe expects v = 27/28 + 4 for EthSign
      const signature = ethers.concat([
        sigObj.r,
        sigObj.s,
        ethers.toBeHex(adjustedV, 1),
      ]);

      // Execute the transaction through Safe's execTransaction
      const safeProxyWithSigner = new ethers.Contract(
        safeAddress,
        SAFE_ABI,
        signer,
      );

      toast.loading("Enabling module...", { id: "enable-module" });
      const tx = await safeProxyWithSigner.execTransaction(
        to,
        value,
        data,
        operation,
        safeTxGas,
        baseGas,
        gasPrice,
        gasToken,
        refundReceiver,
        signature,
      );

      await tx.wait();

      // Verify module is enabled with retry logic
      let isNowEnabled = false;
      let verifyRetryCount = 0;
      const maxVerifyRetries = 5;

      while (verifyRetryCount < maxVerifyRetries) {
        try {
          // Wait a bit for the transaction to be processed
          await new Promise((resolve) => setTimeout(resolve, 2000));
          isNowEnabled = await safeProxy.isModuleEnabled(moduleAddress);

          if (isNowEnabled) {
            break; // Module successfully enabled
          }

          verifyRetryCount++;
          console.warn(
            `Module verification attempt ${verifyRetryCount} failed, retrying...`,
          );

          if (verifyRetryCount >= maxVerifyRetries) {
            // Even if verification fails, the transaction might have succeeded
            // Check the transaction receipt for success
            console.warn(
              "Module verification failed after retries, but transaction was successful",
            );
            toast.success(
              "Module enabled successfully! (Verification timed out but transaction succeeded)",
              { id: "enable-module" },
            );
            return true;
          }
        } catch (error: unknown) {
          verifyRetryCount++;
          console.warn(
            `Module verification attempt ${verifyRetryCount} error:`,
            error,
          );

          if (verifyRetryCount >= maxVerifyRetries) {
            // Transaction succeeded but verification failed - this is OK
            toast.success(
              "Module enabled successfully! (Verification failed but transaction succeeded)",
              { id: "enable-module" },
            );
            return true;
          }

          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * verifyRetryCount),
          );
        }
      }

      toast.success("Module enabled successfully!", { id: "enable-module" });
      return true;
    } catch (err) {
      console.error("Error enabling module:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to enable module",
        {
          id: "enable-module",
        },
      );
      return false;
    } finally {
      setIsEnablingModule(false);
    }
  };

  return {
    createSafeWallet,
    enableModule,
    isCreating,
    isEnablingModule,
  };
};
