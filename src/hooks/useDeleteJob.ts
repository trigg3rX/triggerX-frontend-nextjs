import { devLog } from "@/lib/devLog";
import { useState } from "react";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import JobRegistryArtifact from "@/artifacts/JobRegistry.json";
import { useChainId } from "wagmi";
import { getJobRegistryAddress } from "@/utils/contractAddresses";

export function useDeleteJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chainId = useChainId();

  const deleteJob = async (jobId: number, refetch?: () => void) => {
    setLoading(true);
    try {
      devLog("deleting....");
      // 1. Call contract deleteJob
      if (typeof window.ethereum === "undefined") {
        toast.error("Please install MetaMask to use this feature");
        setLoading(false);
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const jobRegistryAddress = getJobRegistryAddress(chainId);
      if (!jobRegistryAddress) {
        setError(
          `Job registry contract address not set for chain ${chainId}. Please contact support.`,
        );
        setLoading(false);
        return;
      }
      const jobContract = new ethers.Contract(
        jobRegistryAddress,
        JobRegistryArtifact.abi,
        signer,
      );
      devLog("Calling contract deleteJob for jobId:", jobId);
      const tx = await jobContract.deleteJob(jobId);
      toast.loading("Waiting for blockchain confirmation...");
      await tx.wait();
      toast.dismiss();
      toast.success("Job deleted on blockchain");

      // 2. Call API to delete job from DB
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_BASE_URL) {
        setError("API base URL not set. Please contact support.");
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/jobs/delete/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
      });
      devLog("Response....", response);
      if (!response.ok) {
        throw new Error("Failed to delete job from the database");
      }
      toast.success("Job deleted successfully");
      if (refetch) {
        refetch();
      }
    } catch (err) {
      devLog("catch", err);
      toast.error("Failed to delete job");
    } finally {
      setLoading(false);
    }
  };

  return { deleteJob, loading, error };
}
