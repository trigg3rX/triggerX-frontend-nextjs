import React, { useState } from "react";
import { ApiEndpoint } from "@/data/apiData";
import ApiEndpointDisplay from "../api/ApiEndpoint";
import ParameterTable from "../api/ParameterTable";
import { Typography } from "../ui/Typography";
import ApiRequestCodeBlock from "./ApiRequestCodeBlock";
import ApiResponseCodeBlock from "./ApiResponseCodeBlock";

interface ApiDetailViewProps {
  api: ApiEndpoint;
}

const ApiDetailView: React.FC<ApiDetailViewProps> = ({ api }) => {
  const [activeStatus, setActiveStatus] = useState<string>(
    api.responses[0].status,
  );

  const statuses = api.responses.map((res) => {
    let color = "bg-green-500";
    if (res.status === "400") color = "bg-yellow-500";
    if (["401", "403", "500"].includes(res.status)) color = "bg-red-500";
    return { code: res.status, color };
  });

  const responseContent: Record<string, React.ReactNode> = {};
  api.responses.forEach((res) => {
    if (Array.isArray(res.content)) {
      responseContent[res.status] = (
        <div className="text-sm text-[#E6E6E6]">
          {"{"}
          <div className="ml-4">
            {res.content.map((param) => (
              <div key={param.name}>
                <span className="text-[#FF616D]">&quot;{param.name}&quot;</span>
                : <span className="text-[#C3E88D]">{param.type}</span>,<br />
              </div>
            ))}
          </div>
          {"}"}
        </div>
      );
    } else {
      responseContent[res.status] = (
        <div className="ml-4">
          <span className="text-[#C3E88D]">{res.content}</span>
        </div>
      );
    }
  });

  return (
    <div className="space-y-4">
      <>
        <Typography variant="h2" align="left">
          {api.name}
        </Typography>
        <Typography variant="body" color="secondary" align="left">
          {api.description}
        </Typography>
      </>

      {/* Endpoint */}
      <ApiEndpointDisplay
        method={api.method}
        endpoint={api.endpoint}
        path={api.endpointPath}
      />

      {/* Headers */}
      <ParameterTable title="Headers" parameters={api.headers} />

      {/* Query Parameters */}
      {api.queryParams && api.queryParams.length > 0 && (
        <ParameterTable title="Query Parameters" parameters={api.queryParams} />
      )}

      {/* Request and Response Sample viewers can be added here similarly */}
      {api.requestSample && (
        <>
          <ApiRequestCodeBlock requestSamples={[api.requestSample]} />
        </>
      )}
      {/* Response Section */}
      <ApiResponseCodeBlock
        statuses={statuses}
        activeStatus={activeStatus}
        setActiveStatus={setActiveStatus}
        responseContent={responseContent}
      />
    </div>
  );
};

export default ApiDetailView;
