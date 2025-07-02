import React from "react";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";

const QuickStartGuide = () => {
  const steps: { bg: string; label: string; text: string }[] = [
    {
      bg: "bg-[#F8FF7C]",
      label: "1",
      text: 'Generate an API key in the "API Key Generator" tab',
    },
    {
      bg: "bg-[#FFFFFF]",
      label: "2",
      text: "Review the API documentation for available endpoints",
    },
    {
      bg: "bg-[#F8FF7C]",
      label: "3",
      text: "Make API requests using your generated key",
    },
    {
      bg: "bg-[#FFFFFF]",
      label: "4",
      text: "Monitor your usage and rate limits",
    },
  ];

  return (
    <Card className="!p-0 w-full lg:w-[35%] overflow-hidden">
      <div className="p-6">
        <Typography variant="h2" align="left">
          Quick Start Guide
        </Typography>
        <ol className="space-y-4 my-6">
          {steps.map((step) => (
            <li key={step.label} className="flex gap-5 items-center">
              <Typography
                variant="badge"
                className={`${step.bg} w-10 h-10 text-black rounded-full flex items-center justify-center`}
              >
                {step.label}
              </Typography>
              <Typography variant="body" align="left">
                {step.text}
              </Typography>
            </li>
          ))}
        </ol>
      </div>
      <div className="bg-[#242323] p-6">
        <Typography variant="h3" className="mb-2" align="left">
          Need Help?
        </Typography>
        <Typography variant="body" align="left">
          If you have any questions or need assistance, please don&apos;t
          hesitate to contact our support team at <br />
          <a className="underline" href="mailto:hello@triggerx.network">
            hello@triggerx.network
          </a>
        </Typography>
      </div>
    </Card>
  );
};

export default QuickStartGuide;
