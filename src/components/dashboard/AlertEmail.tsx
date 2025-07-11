"use client";

import { useState } from "react";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { InputField } from "../ui/InputField";

interface AlertEmailProps {
  userAddress: string;
}

const AlertEmail = ({ userAddress }: AlertEmailProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (email: string) => /.+@.+\..+/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/email`,
        {
          method: "POST",
          body: JSON.stringify({ userAddress, userEmail: email }),
        },
      );
      if (res.ok) {
        setSuccess("Email saved! You'll be notified.");
        setEmail("");
        setError("");
      } else {
        setError("Failed to save email. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
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
            if (error) setError("");
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
          Submit
        </Button>
      </form>
    </Card>
  );
};

export default AlertEmail;
