import React from "react";
import { HttpMethod } from "@/data/apiData";
import ApiMethod from "../api/ApiMethod";
import { CopyButton } from "../ui/CopyButton";
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
    <Card className="border-none ">
      <Typography
        as="code"
        variant="body"
        className="flex-1 rounded-lg text-sm overflow-auto flex items-center bg-transparen justify-between "
        color="primary"
      >
        <div>
          <span className="mr-3">
            <ApiMethod method={method} />
          </span>
          {endpoint}
          {path && <span>{path}</span>}
        </div>

        <div>
          <CopyButton text={fullEndpoint} aria-label="Copy endpoint" />
        </div>
      </Typography>
    </Card>
  );
};

export default ApiEndpoint;
