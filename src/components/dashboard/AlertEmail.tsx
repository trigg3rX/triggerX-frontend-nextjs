"use client";

import { useState } from "react";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { InputField } from "../ui/InputField";
import { devLog } from "@/lib/devLog";

interface AlertEmailProps {
  user_address: string;
}

const AlertEmail = ({ user_address }: AlertEmailProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);

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
        setSuccess("Email sent successfully");
        setEmail("");
        setError("");
        devLog("Email sent successfully for:", email);
      }
    } catch (err) {
      setError("Failed to sent email. Try again.");
      devLog("Failed to sent email. Try again.", err);
    } finally {
      setIsLoading(false);
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
        <Button type="submit" className="w-full my-4">
          {isLoading ? "Sending..." : "Submit"}
        </Button>
      </form>
    </Card>
  );
};

export default AlertEmail;
