import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { devLog } from "@/lib/devLog";
import {
  CreateJobInput,
  TimeBasedJobInput,
  EventBasedJobInput,
  ConditionBasedJobInput,
  ApiResult,
  JobResponse,
  ErrorResponse,
  SuccessResponse,
} from "@/types/sdk-job";

// Import the SDK
import { TriggerXClient, createJob as createJobSDK } from "sdk-triggerx";
import type { Signer } from "ethers";

interface UseCreateJobResult {
  createJob: (jobInput: CreateJobInput) => Promise<ApiResult<JobResponse>>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
}

/**
 * Custom hook for creating jobs using the TriggerX SDK
 * Uses types from sdk-job.ts and the sdk-triggerx package
 */
export function useCreateJob(): UseCreateJobResult {
  const { address } = useAccount();
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

        // Validate API configuration
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

        if (!API_BASE_URL) {
          const errorResult: ErrorResponse = {
            success: false,
            error: "API base URL not configured",
            errorCode: "CONFIGURATION_ERROR",
            errorType: "CONFIGURATION_ERROR",
            httpStatusCode: 500,
          };
          setError("API base URL not configured");
          setIsLoading(false);
          return errorResult;
        }

        if (!API_KEY) {
          const errorResult: ErrorResponse = {
            success: false,
            error: "API key not configured",
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
        const client = new TriggerXClient(API_KEY, {
          baseURL: API_BASE_URL,
        });

        // Extract the base job input (without jobType/argType discriminator)
        // The SDK expects the base types, not the discriminated union
        // Remove jobType and argType from the input for SDK compatibility
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { jobType: _jobType, argType: _argType, ...restInput } = jobInput;

        // Type assertion - the SDK will handle the validation
        const baseJobInput = restInput as
          | TimeBasedJobInput
          | EventBasedJobInput
          | ConditionBasedJobInput;

        // Call SDK createJob function
        devLog("[useCreateJob] Calling SDK createJob function");
        // Note: createJobSDK takes client and params object
        const response = await createJobSDK(client, {
          jobInput: baseJobInput,
          signer: signer as Signer,
        });

        // SDK returns JobResponse directly
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
    [address],
  );

  return {
    createJob,
    isLoading,
    error,
    resetError,
  };
}
