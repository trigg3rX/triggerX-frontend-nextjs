"use client";
import { useState, useEffect } from "react";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { InputField } from "../ui/InputField";
import { devLog } from "@/lib/devLog";
import { useJobs } from "@/hooks/useJobs";
import toast from "react-hot-toast";

interface AlertEmailProps {
  user_address: string;
}

const AlertEmail = ({ user_address }: AlertEmailProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { jobs, loading: jobsLoading } = useJobs();
  const [hasJobs, setHasJobs] = useState(true);

  useEffect(() => {
    if (!jobsLoading) {
      setHasJobs(jobs.length > 0);
    }
  }, [jobs, jobsLoading]);

  const validateEmail = (email: string) => {
    const isValid = /.+@.+\..+/.test(email);
    devLog("Validating email:", email, "Result:", isValid);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    devLog("Form submitted with email:", email);
    setSuccess("");
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      devLog("Invalid email entered:", email);
      return;
    }

    try {
      devLog(
        "Sending POST request to:",
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/email`,
        {
          user_address,
          email_id: email,
        },
      );
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/email`,
        {
          method: "POST",
          body: JSON.stringify({ user_address, email_id: email }),
          headers: {
            "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
        },
      );
      devLog("API response status:", res.status);
      const data = await res.json().catch(() => null);
      devLog("API response body:", data);
      if (res.ok) {
        toast.success("Email sent successfully");
        setEmail("");
        setError("");
        devLog("Email sent successfully for:", email);
      }
    } catch (err) {
      toast.error("Failed to sent email. Try again.");
      devLog("Failed to sent email. Try again.", err);
    }
  };

  return (
    <Card>
      <div className="flex items-center">
        <Typography variant="h2" color="white" align="left">
          Alert
        </Typography>
      </div>
      <form onSubmit={handleSubmit} className="w-full my-4">
        <InputField
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(value) => {
            setEmail(value);
          }}
          className="w-full"
        />
        {!hasJobs && !jobsLoading && (
          <div className="mt-2 text-xs bg-yellow-100  text-yellow-800 p-2 rounded">
            <Typography
              variant="body"
              align="left"
              color="inherit"
              className="mt-1"
            >
              No jobs found for your address.
            </Typography>
          </div>
        )}
        {error && (
          <Typography
            variant="body"
            color="error"
            align="left"
            className="mt-1"
          >
            {error}
          </Typography>
        )}
        {success && (
          <Typography
            variant="body"
            color="success"
            align="left"
            className="mt-1"
          >
            {success}
          </Typography>
        )}
        <Button type="submit" className="w-full my-4" disabled={!hasJobs}>
          Submit
        </Button>
      </form>
    </Card>
  );
};

export default AlertEmail;
