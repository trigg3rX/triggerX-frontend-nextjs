import { devLog } from "@/lib/devLog";
import { useState } from "react";
import toast from "react-hot-toast";

export function useUpdateJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   *
   * @param jobId Numeric identifier of the job to update
   * @param payload Serializable payload to send as the update body
   * @param refetch Optional callback to run on success (e.g., to refresh UI)
   */
  const updateJob = async (
    jobId: number,
    payload: unknown,
    refetch?: () => void,
  ) => {
    setLoading(true);
    setError(null);
    try {
      devLog("Updating job...", jobId, payload);
      const response = await fetch(`/api/jobs/update/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
      devLog("Update job error", err);
      toast.error("Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  return { updateJob, loading, error };
}
