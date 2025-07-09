"use client";
// import { FiInfo } from "react-icons/fi";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";
import { useState } from "react";
import { Button } from "../ui/Button";
import { InputField } from "../ui/InputField";
// import Tooltip from "../ui/Tooltip";

const AlertEmail = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    // Simple email validation
    return /.+@.+\..+/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    // You can replace this with your actual submit logic
    alert(`Subscribed with: ${email}`);
    setEmail("");
    setError("");
  };

  return (
    <Card className="">
      <div className="flex items-center">
        <Typography variant="h2" color="white" align="left">
          Alert
        </Typography>
        {/* <Tooltip
          title={
            "TriggerGas (TG) is the standard unit for calculating computational and resource costs on the TriggerX platform."
          }
          placement="right"
        >
          <FiInfo
            className="text-gray-400 hover:text-white cursor-pointer ml-2 mb-1"
            size={15}
          />
        </Tooltip> */}
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
      </form>
      <Button type="submit" className="w-full">
        Submit
      </Button>
    </Card>
  );
};

export default AlertEmail;
