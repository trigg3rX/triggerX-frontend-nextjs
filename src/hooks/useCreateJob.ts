import { useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import { devLog } from "@/lib/devLog";
import {
  CreateJobInput,
  ApiResult,
  JobResponse,
  ErrorResponse,
  SuccessResponse,
} from "@/types/sdk-job";
import { TriggerXClient, createJob as createJobSDK } from "sdk-triggerx";
import type { Signer } from "ethers";
import { getWalletDisplayName } from "@/utils/safeWalletNames";

interface UseCreateJobResult {
  createJob: (jobInput: CreateJobInput) => Promise<ApiResult<JobResponse>>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
}

export function useCreateJob(): UseCreateJobResult {
  const { address } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const createJob = useCallback(
    async (jobInput: CreateJobInput): Promise<ApiResult<JobResponse>> => {
      setIsLoading(true);
      setError(null);

      try {
        if (jobInput.walletMode === "safe") {
          if (!jobInput.safeAddress) {
            const errorResult: ErrorResponse = {
              success: false,
              error: "Safe wallet address is required.",
              errorCode: "VALIDATION_ERROR",
              errorType: "VALIDATION_ERROR",
              httpStatusCode: 400,
            };
            setError(errorResult.error);
            setIsLoading(false);
            return errorResult;
          }
          if (!("safeName" in jobInput) || !jobInput.safeName) {
            const displayName = getWalletDisplayName(
              jobInput.safeAddress!,
              Number(chainId || 0),
            );
            if (displayName) {
              jobInput = {
                ...jobInput,
                safeName: displayName,
              } as CreateJobInput;
            }
          }
        }

        // Validate user address
        if (!address) {
          const errorResult: ErrorResponse = {
            success: false,
            error: "Wallet not connected",
            errorCode: "UNAUTHORIZED",
            errorType: "AUTHENTICATION_ERROR",
            httpStatusCode: 401,
          };
          setError("Wallet not connected");
          setIsLoading(false);
          return errorResult;
        }

        const API_KEY = process.env.NEXT_PUBLIC_SDK_API_KEY;

        if (!API_KEY) {
          const errorResult: ErrorResponse = {
            success: false,
            error: "SDK API key not configured",
            errorCode: "UNAUTHORIZED",
            errorType: "AUTHENTICATION_ERROR",
            httpStatusCode: 401,
          };
          setError("API key not configured");
          setIsLoading(false);
          return errorResult;
        }

        devLog("[useCreateJob] Creating job with input:", jobInput);

        // Get signer from wallet
        if (typeof window === "undefined" || !window.ethereum) {
          const errorResult: ErrorResponse = {
            success: false,
            error: "Wallet provider not available",
            errorCode: "CONFIGURATION_ERROR",
            errorType: "CONFIGURATION_ERROR",
            httpStatusCode: 500,
          };
          setError("Wallet provider not available");
          setIsLoading(false);
          return errorResult;
        }

        const provider = new ethers.BrowserProvider(
          window.ethereum as ethers.Eip1193Provider,
        );

        const signer = await provider.getSigner();

        // Initialize SDK client
        const client = new TriggerXClient(API_KEY);

        const response = await createJobSDK(client, {
          jobInput: jobInput,
          signer: signer as Signer,
        });

        let result: ApiResult<JobResponse>;

        if (response.success) {
          result = {
            success: true,
            data: response,
          } as SuccessResponse<JobResponse>;
        } else {
          result = {
            success: false,
            error: response.error || "Failed to create job",
            errorCode: response.errorCode || "UNKNOWN_ERROR",
            errorType: response.errorType || "UNKNOWN_ERROR",
            httpStatusCode: response.httpStatusCode,
            details: response.details,
          } as ErrorResponse;
        }

        devLog("[useCreateJob] Job created successfully:", result);

        if (result.success) {
          setIsLoading(false);
          return result;
        } else {
          setError(result.error);
          setIsLoading(false);
          return result;
        }
      } catch (err: unknown) {
        devLog("[useCreateJob] Error creating job:", err);

        const errorMessage =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "error" in err
              ? String((err as { error: unknown }).error)
              : "Failed to create job. Please try again.";

        const errorCode =
          typeof err === "object" && err !== null && "errorCode" in err
            ? String((err as { errorCode: unknown }).errorCode)
            : "UNKNOWN_ERROR";

        const errorType =
          typeof err === "object" && err !== null && "errorType" in err
            ? String((err as { errorType: unknown }).errorType)
            : "UNKNOWN_ERROR";

        const httpStatusCode =
          typeof err === "object" &&
          err !== null &&
          ("status" in err || "httpStatusCode" in err)
            ? (err as { status?: number; httpStatusCode?: number }).status ||
              (err as { status?: number; httpStatusCode?: number })
                .httpStatusCode
            : undefined;

        const details =
          typeof err === "object" && err !== null && "details" in err
            ? (err as { details: unknown }).details
            : err;

        const errorResult: ErrorResponse = {
          success: false,
          error: errorMessage,
          errorCode: errorCode as ErrorResponse["errorCode"],
          errorType: errorType as ErrorResponse["errorType"],
          httpStatusCode: httpStatusCode as ErrorResponse["httpStatusCode"],
          details,
        };

        setError(errorResult.error);
        setIsLoading(false);
        return errorResult;
      }
    },
    [address, chainId],
  );

  return {
    createJob,
    isLoading,
    error,
    resetError,
  };
}
