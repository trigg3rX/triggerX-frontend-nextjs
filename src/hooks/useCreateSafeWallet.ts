import { useState, useRef } from "react";
import { useChainId } from "wagmi";
import { ethers } from "ethers";
import {
  getSafeWalletFactoryAddress,
  getSafeModuleAddress,
} from "@/utils/contractAddresses";
import TriggerXSafeFactoryArtifact from "@/artifacts/TriggerXSafeFactory.json";
import { getSafeChainInfo, getSafeQueueUrl } from "@/utils/safeChains";
import Safe from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import SafeArtifact from "@/artifacts/Safe.json";
import type { SafeTransaction } from "@safe-global/safe-core-sdk-types";
import type {
  CreateSafeResult,
  SignResult,
  SubmitResult,
  EnableModuleResult,
} from "@/types/safe";

export const useCreateSafeWallet = () => {
  const chainId = useChainId();
  const [isCreating, setIsCreating] = useState(false);
  const [isEnablingModule, setIsEnablingModule] = useState(false);
  const [isSigningEnableModule, setIsSigningEnableModule] = useState(false);
  const [isExecutingEnableModule, setIsExecutingEnableModule] = useState(false);
  const [isProposingEnableModule, setIsProposingEnableModule] = useState(false);

  // Store signed transaction data for the two-step flow
  const signedTxRef = useRef<{
    safeSdk: Safe;
    signedSafeTx: SafeTransaction;
    safeTxHash: string;
    safeAddress: string;
    threshold: number;
    owners: string[];
    signerAddress: string;
  } | null>(null);

  // Helper: Read Safe info with retry logic
  const readSafeInfo = async (
    safeAddress: string,
    moduleAddress: string,
    provider: ethers.BrowserProvider,
  ): Promise<{
    threshold: number;
    owners: string[];
    isEnabled: boolean;
  }> => {
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

    return {
      threshold: Number(thresholdBig),
      owners,
      isEnabled,
    };
  };

  // Create Safe wallet (Step 1)
  const createSafeWallet = async (
    userAddress: string,
  ): Promise<CreateSafeResult> => {
    setIsCreating(true);
    try {
      const factoryAddress = getSafeWalletFactoryAddress(chainId);
      if (!factoryAddress) {
        return {
          success: false,
          safeAddress: null,
          error: "Safe Wallet Factory address not configured for this network",
        };
      }

      if (typeof window.ethereum === "undefined") {
        return {
          success: false,
          safeAddress: null,
          error: "Please connect your wallet",
        };
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factory = new ethers.Contract(
        factoryAddress,
        TriggerXSafeFactoryArtifact.abi,
        signer,
      );

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

      if (!safeAddress) {
        return {
          success: false,
          safeAddress: null,
          error: "Failed to retrieve Safe address from transaction",
        };
      }

      return {
        success: true,
        safeAddress,
      };
    } catch (err) {
      console.error("Error creating Safe wallet:", err);
      const getShortErrorMessage = (error: Error): string => {
        const message = error.message.toLowerCase();

        if (
          message.includes("user rejected") ||
          message.includes("user denied")
        ) {
          return "Transaction rejected by user";
        }
        if (message.includes("insufficient funds")) {
          return "Insufficient funds for transaction";
        }
        if (message.includes("network")) {
          return "Network error occurred";
        }
        if (message.includes("gas")) {
          return "Gas estimation failed";
        }
        if (message.includes("metamask")) {
          return "MetaMask error";
        }

        // Fallback: take first sentence or 50 chars
        const msg = error.message.split(".")[0];
        return msg.length > 50 ? msg.substring(0, 50) + "..." : msg;
      };

      return {
        success: false,
        safeAddress: null,
        error:
          err instanceof Error
            ? getShortErrorMessage(err)
            : "Failed to create Safe wallet",
      };
    } finally {
      setIsCreating(false);
    }
  };

  // Sign enable module transaction (Step 2)
  const signEnableModule = async (safeAddress: string): Promise<SignResult> => {
    setIsSigningEnableModule(true);

    try {
      const moduleAddress = getSafeModuleAddress(chainId);
      if (!moduleAddress) {
        return {
          success: false,
          error: "Safe Module address not configured for this network",
        };
      }

      if (typeof window.ethereum === "undefined") {
        return {
          success: false,
          error: "Please connect your wallet",
        };
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      // Read Safe info with retry logic
      const { threshold, owners, isEnabled } = await readSafeInfo(
        safeAddress,
        moduleAddress,
        provider,
      );

      const normalizedOwners = owners.map((owner: string) =>
        owner.toLowerCase(),
      );

      if (!normalizedOwners.includes(signerAddress.toLowerCase())) {
        return {
          success: false,
          error: "Connected wallet is not an owner of this Safe",
        };
      }

      if (isEnabled) {
        // Module already enabled - this is actually a success state
        signedTxRef.current = null;
        return {
          success: true,
          data: {
            threshold,
            owners,
            safeTxHash: "", // No transaction needed
          },
        };
      }

      // Initialize Safe SDK
      const safeSdk = await Safe.init({
        provider: window.ethereum as unknown as ethers.Eip1193Provider,
        safeAddress,
      });

      // Create enable module transaction
      const safeTransaction = await safeSdk.createEnableModuleTx(moduleAddress);

      // Sign the transaction using Safe SDK (this triggers the EIP-712 signature)
      const signedSafeTx = await safeSdk.signTransaction(safeTransaction);
      const safeTxHash = await safeSdk.getTransactionHash(signedSafeTx);

      // Store signed transaction for submitEnableModule
      signedTxRef.current = {
        safeSdk,
        signedSafeTx,
        safeTxHash,
        safeAddress,
        threshold,
        owners,
        signerAddress,
      };

      return {
        success: true,
        data: {
          threshold,
          owners,
          safeTxHash,
        },
      };
    } catch (err) {
      console.error("Error signing enable module transaction:", err);
      signedTxRef.current = null;

      const getErrorMessage = (error: Error): string => {
        const message = error.message.toLowerCase();

        if (
          message.includes("user rejected") ||
          message.includes("user denied")
        ) {
          return "Signature rejected by user";
        }
        if (message.includes("network")) {
          return "Network error occurred";
        }

        // Fallback: take first sentence or 50 chars
        const msg = error.message.split(".")[0];
        return msg.length > 50 ? msg.substring(0, 50) + "..." : msg;
      };

      return {
        success: false,
        error:
          err instanceof Error
            ? getErrorMessage(err)
            : "Failed to sign transaction",
      };
    } finally {
      setIsSigningEnableModule(false);
    }
  };

  // Submit (execute or propose) the signed enable module transaction (Step 3)
  const submitEnableModule = async (): Promise<SubmitResult> => {
    if (!signedTxRef.current) {
      return {
        success: false,
        error: "No signed transaction found. Please sign first.",
      };
    }

    const {
      safeSdk,
      signedSafeTx,
      safeTxHash,
      safeAddress,
      threshold,
      owners,
      signerAddress,
    } = signedTxRef.current;

    try {
      const moduleAddress = getSafeModuleAddress(chainId);
      if (!moduleAddress) {
        return {
          success: false,
          error: "Safe Module address not configured for this network",
        };
      }

      if (threshold <= 1) {
        setIsExecutingEnableModule(true);

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

        // Clear signed tx after execution
        signedTxRef.current = null;

        return {
          success: true,
          data: {
            status: "executed",
            threshold,
            owners,
            transactionHash: executeTxResponse.hash,
          },
        };
      }

      // Multisig flow - propose to Safe Transaction Service
      const chainInfo = await getSafeChainInfo(chainId);
      let queueUrl: string | null = null;

      if (chainInfo.transactionService) {
        setIsProposingEnableModule(true);
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
        } catch (error) {
          console.warn(
            "Failed to propose enable-module transaction to Safe service:",
            error,
          );
          // Don't fail completely if proposal fails
        } finally {
          setIsProposingEnableModule(false);
        }
      }

      const fallbackUrl = await getSafeQueueUrl(chainId, safeAddress);

      // Clear signed tx after proposing
      signedTxRef.current = null;

      return {
        success: true,
        data: {
          status: "multisig",
          threshold,
          owners,
          safeTxHash,
          queueUrl: queueUrl || fallbackUrl,
          fallbackUrl,
        },
      };
    } catch (err) {
      console.error("Error submitting enable module transaction:", err);

      const getErrorMessage = (error: Error): string => {
        const message = error.message.toLowerCase();

        if (
          message.includes("user rejected") ||
          message.includes("user denied")
        ) {
          return "Transaction rejected by user";
        }
        if (message.includes("insufficient funds")) {
          return "Insufficient funds for transaction";
        }
        if (message.includes("network")) {
          return "Network error occurred";
        }
        if (message.includes("gas")) {
          return "Gas estimation failed";
        }

        // Fallback: take first sentence or 50 chars
        const msg = error.message.split(".")[0];
        return msg.length > 50 ? msg.substring(0, 50) + "..." : msg;
      };

      return {
        success: false,
        error:
          err instanceof Error
            ? getErrorMessage(err)
            : "Failed to submit transaction",
      };
    } finally {
      setIsExecutingEnableModule(false);
      setIsProposingEnableModule(false);
    }
  };

  // Keep existing enableModule for backward compatibility - now uses the two-step flow
  const enableModule = async (
    safeAddress: string,
  ): Promise<EnableModuleResult | null> => {
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
      const signerAddress = await signer.getAddress();

      // Read Safe info with retry logic
      const { threshold, owners, isEnabled } = await readSafeInfo(
        safeAddress,
        moduleAddress,
        provider,
      );

      const normalizedOwners = owners.map((owner: string) =>
        owner.toLowerCase(),
      );

      if (!normalizedOwners.includes(signerAddress.toLowerCase())) {
        throw new Error("Connected wallet is not an owner of this Safe");
      }

      if (isEnabled) {
        return {
          status: "already_enabled",
          threshold,
          owners,
        };
      }

      // Use the two-step flow
      const signResult = await signEnableModule(safeAddress);
      if (!signResult.success || !signResult.data) {
        return null;
      }

      const submitResult = await submitEnableModule();
      if (!submitResult.success || !submitResult.data) {
        return null;
      }

      return submitResult.data;
    } catch (err) {
      console.error("Error enabling module:", err);
      return null;
    } finally {
      setIsEnablingModule(false);
    }
  };

  return {
    createSafeWallet,
    signEnableModule,
    submitEnableModule,
    enableModule,
    isCreating,
    isEnablingModule,
    isSigningEnableModule,
    isExecutingEnableModule,
    isProposingEnableModule,
  };
};
