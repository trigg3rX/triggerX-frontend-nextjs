import { Card } from "@/app/components/ui/Card";
import { Typography } from "@/app/components/ui/Typography";
import React from "react";

interface TemplateInfoSectionProps {
  title: string;
  description: string;
  steps: string[];
  className?: string;
}

const TemplateInfoSection: React.FC<TemplateInfoSectionProps> = ({
  title,
  description,
  steps,
  className = "",
}) => (
  <Card className={className}>
    <Typography variant="h2" align="left" className="mb-2 sm:mb-4">
      {title}
    </Typography>
    <Typography variant="body" align="left" color="secondary" className="mb-6">
      {description}
    </Typography>
    <div className="space-y-2">
      <Typography variant="h2" align="left" className="mb-2 sm:mb-4">
        Setup Steps
      </Typography>
      <ul className="list-disc list-inside text-gray-300 space-y-1 sm:space-y-2 ml-2 text-[10px] xs:text-xs sm:text-sm">
        {steps.map((step, idx) => (
          <li key={idx}>{step}</li>
        ))}
      </ul>
    </div>
  </Card>
);

export default TemplateInfoSection;
