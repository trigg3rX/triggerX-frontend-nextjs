import { useState } from "react";
import { useChainId } from "wagmi";
import { ethers } from "ethers";
import {
  getSafeWalletFactoryAddress,
  getSafeModuleAddress,
} from "@/utils/contractAddresses";
import toast from "react-hot-toast";
import TriggerXSafeFactoryArtifact from "@/artifacts/TriggerXSafeFactory.json";
import { getSafeChainInfo, getSafeQueueUrl } from "@/utils/safeChains";
import Safe from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import SafeArtifact from "@/artifacts/Safe.json";

export type EnableModuleResult =
  | {
      status: "already_enabled";
      threshold: number;
      owners: string[];
    }
  | {
      status: "executed";
      threshold: number;
      owners: string[];
      transactionHash: string;
    }
  | {
      status: "multisig";
      threshold: number;
      owners: string[];
      safeTxHash: string;
      queueUrl: string | null;
      fallbackUrl: string | null;
    };

export const useCreateSafeWallet = () => {
  const chainId = useChainId();
  const [isCreating, setIsCreating] = useState(false);
  const [isEnablingModule, setIsEnablingModule] = useState(false);
  const [isSigningEnableModule, setIsSigningEnableModule] = useState(false);
  const [isExecutingEnableModule, setIsExecutingEnableModule] = useState(false);
  const [isProposingEnableModule, setIsProposingEnableModule] = useState(false);

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

  const enableModule = async (
    safeAddress: string,
  ): Promise<EnableModuleResult | null> => {
    setIsEnablingModule(true);
    setIsSigningEnableModule(false);
    setIsExecutingEnableModule(false);
    setIsProposingEnableModule(false);

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
      const signerAddress = await signer.getAddress();

      // Retry logic for newly created Safes
      const safeProxy = new ethers.Contract(
        safeAddress,
        SafeArtifact.abi,
        provider,
      );
      let thresholdBig: bigint | undefined;
      let owners: string[] | undefined;
      let isEnabled: boolean | undefined;
      let retryCount = 0;
      const maxRetries = 5;

      while (retryCount < maxRetries) {
        try {
          const results = await Promise.all([
            safeProxy.getThreshold(),
            safeProxy.getOwners(),
            safeProxy.isModuleEnabled(moduleAddress),
          ]);
          thresholdBig = results[0];
          owners = results[1];
          isEnabled = results[2];
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw error;
          }
          console.warn(
            `Attempt ${retryCount} to read Safe info failed, retrying...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retryCount)),
          );
        }
      }

      if (!thresholdBig || !owners || isEnabled === undefined) {
        throw new Error("Failed to read Safe information after retries");
      }

      const normalizedOwners = owners.map((owner: string) =>
        owner.toLowerCase(),
      );

      if (!normalizedOwners.includes(signerAddress.toLowerCase())) {
        throw new Error("Connected wallet is not an owner of this Safe");
      }

      const threshold = Number(thresholdBig);

      if (isEnabled) {
        toast.success("Module is already enabled!");
        return {
          status: "already_enabled",
          threshold,
          owners,
        };
      }

      // Initialize Safe SDK
      const safeSdk = await Safe.init({
        provider: window.ethereum as unknown as ethers.Eip1193Provider,
        safeAddress,
      });

      // Create enable module transaction
      const safeTransaction = await safeSdk.createEnableModuleTx(moduleAddress);

      setIsSigningEnableModule(true);
      toast.loading("Please sign the transaction to enable the module...", {
        id: "enable-module",
      });

      // Sign the transaction using Safe SDK (this triggers the EIP-712 signature)
      const signedSafeTx = await safeSdk.signTransaction(safeTransaction);
      const safeTxHash = await safeSdk.getTransactionHash(signedSafeTx);

      setIsSigningEnableModule(false);

      if (threshold <= 1) {
        setIsExecutingEnableModule(true);
        toast.loading("Executing module enable transaction...", {
          id: "enable-module",
        });

        const executeTxResponse =
          await safeSdk.executeTransaction(signedSafeTx);
        const txResponse = executeTxResponse.transactionResponse;

        if (
          txResponse &&
          typeof txResponse === "object" &&
          "wait" in txResponse &&
          typeof txResponse.wait === "function"
        ) {
          await txResponse.wait();
        }

        const isNowEnabled = await safeProxy.isModuleEnabled(moduleAddress);
        if (isNowEnabled) {
          toast.success("Module enabled successfully!", {
            id: "enable-module",
          });
        } else {
          toast.success(
            "Module enable transaction submitted. It may take a moment to reflect.",
            { id: "enable-module" },
          );
        }

        return {
          status: "executed",
          threshold,
          owners,
          transactionHash: executeTxResponse.hash,
        };
      }

      // Multisig flow - propose to Safe Transaction Service
      const chainInfo = await getSafeChainInfo(chainId);
      let queueUrl: string | null = null;

      if (chainInfo.transactionService) {
        setIsProposingEnableModule(true);
        toast.loading(
          "Proposing the transaction to Safe Transaction Service...",
          {
            id: "enable-module",
          },
        );
        try {
          const safeApiKey = process.env.NEXT_PUBLIC_SAFE_API_KEY;
          const safeApiKit = new SafeApiKit({
            chainId: BigInt(chainId),
            ...(safeApiKey && { apiKey: safeApiKey }),
          });

          await safeApiKit.proposeTransaction({
            safeAddress,
            safeTransactionData: signedSafeTx.data,
            safeTxHash,
            senderAddress: signerAddress,
            senderSignature:
              signedSafeTx.signatures.get(signerAddress.toLowerCase())?.data ||
              "",
          });

          queueUrl = await getSafeQueueUrl(chainId, safeAddress);

          toast.success(
            "Transaction proposed successfully! Other owners can sign in Safe.",
            { id: "enable-module" },
          );
        } catch (error) {
          console.warn(
            "Failed to propose enable-module transaction to Safe service:",
            error,
          );
          toast.success(
            "Module transaction signed. Open in Safe to collect remaining signatures.",
            { id: "enable-module" },
          );
        } finally {
          setIsProposingEnableModule(false);
        }
      } else {
        toast.success(
          "Module transaction signed. Open in Safe to collect remaining signatures.",
          { id: "enable-module" },
        );
      }

      const fallbackUrl = await getSafeQueueUrl(chainId, safeAddress);

      return {
        status: "multisig",
        threshold,
        owners,
        safeTxHash,
        queueUrl: queueUrl || fallbackUrl,
        fallbackUrl,
      };
    } catch (err) {
      console.error("Error enabling module:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to enable module",
        {
          id: "enable-module",
        },
      );
      return null;
    } finally {
      setIsSigningEnableModule(false);
      setIsExecutingEnableModule(false);
      setIsProposingEnableModule(false);
      setIsEnablingModule(false);
    }
  };

  return {
    createSafeWallet,
    enableModule,
    isCreating,
    isEnablingModule,
    isSigningEnableModule,
    isExecutingEnableModule,
    isProposingEnableModule,
  };
};
