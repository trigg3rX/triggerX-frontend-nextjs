import { devLog } from "@/lib/devLog";
import { useState } from "react";
import toast from "react-hot-toast";

export function useUpdateJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateJob = async (
    jobId: number,
    payload: unknown,
    refetch?: () => void,
  ) => {
    setLoading(true);
    setError(null);
    try {
      devLog("Updating job...", jobId, payload);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_BASE_URL) {
        setError("API base URL not set. Please contact support.");
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/jobs/update/${jobId}`, {
        method: "PUT",
        headers: {
          ...(process.env.NODE_ENV !== "production" && {
            "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          }),
        },
        body: JSON.stringify(payload),
      });
      devLog("Update response:", response);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update job");
      }
      toast.success("Job updated successfully");
      if (refetch) {
        refetch();
      }
    } catch (err) {
      devLog("Update job error:", err);
      toast.error("Failed to update job");
      setError(err instanceof Error ? err.message : "Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  return { updateJob, loading, error };
}
