import React from "react";
import { HttpMethod } from "@/data/apiData";
import ApiMethod from "../api/ApiMethod";
import { LucideCopyButton } from "../ui/CopyButton";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";

interface ApiEndpointProps {
  method: HttpMethod;
  endpoint: string;
  path?: string;
}

const ApiEndpoint: React.FC<ApiEndpointProps> = ({
  method,
  endpoint,
  path,
}) => {
  const fullEndpoint = `${endpoint}${path || ""}`;

  return (
    <Card variant="soft" className="!p-3 border-none">
      <Typography
        as="code"
        variant="body"
        className="flex-1 flex items-center justify-between "
        color="primary"
      >
        <>
          <span className="mr-3 hidden sm:block">
            <ApiMethod method={method} />
          </span>
          <span className="truncate">{endpoint}</span>
          {path && <span>{path}</span>}
        </>

        <LucideCopyButton text={fullEndpoint} aria-label="Copy endpoint" />
      </Typography>
    </Card>
  );
};

export default ApiEndpoint;
