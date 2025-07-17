import { devLog } from "@/lib/devLog";
import { useState } from "react";
import toast from "react-hot-toast";

export function useDeleteJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteJob = async (jobId: number, refetch?: () => void) => {
    setLoading(true);
    try {
      devLog("deleting....");
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
          ...(process.env.NODE_ENV !== "production" && {
            "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          }),
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
