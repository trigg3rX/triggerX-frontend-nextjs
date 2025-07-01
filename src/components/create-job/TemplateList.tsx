import React from "react";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";
import { Template } from "@/types/job";
import { useJob } from "@/contexts/JobContext";

interface TemplateListProps {
  templates: Template[];
}

export const TemplateList: React.FC<TemplateListProps> = ({ templates }) => {
  const { selectedJob, handleJobSelect, handleCreateCustomJob } = useJob();

  return (
    <Card className="h-fit">
      <div className="flex justify-between gap-3 items-center mb-6">
        <Typography variant="h2" align="left" className="text-nowrap w-full">
          Template
        </Typography>
        <Button onClick={handleCreateCustomJob} disabled={!selectedJob}>
          Create Custom Job
        </Button>
      </div>
      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="cursor-pointer"
            onClick={() => handleJobSelect(template)}
          >
            <Card
              variant={selectedJob?.id === template.id ? "gradient" : "default"}
              isActive={selectedJob?.id === template.id}
            >
              <div className="flex justify-between items-center gap-3">
                <Typography
                  variant="h4"
                  align="left"
                  className={`break-all xs:break-keep lg:w-[70%] ${
                    selectedJob?.id === template.id ? "text-white" : ""
                  }`}
                >
                  {template.title}
                </Typography>
                <Typography
                  variant="badge"
                  bgColor="bg-[#FBF197]"
                  color="inherit"
                  className="text-[#202020]"
                >
                  Use
                </Typography>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </Card>
  );
};
