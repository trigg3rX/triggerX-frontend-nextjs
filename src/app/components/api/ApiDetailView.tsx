import React, { useState } from "react";
import { ApiEndpoint, ApiParameter } from "@/data/apiData";
import ApiEndpointDisplay from "../api/ApiEndpoint";
import ParameterTable from "../api/ParameterTable";
import { Typography } from "../ui/Typography";
import { Dropdown } from "../ui/Dropdown";
// Assume you have a Dropdown component or use a native select

interface ApiDetailViewProps {
  api: ApiEndpoint;
}

const ApiDetailView: React.FC<ApiDetailViewProps> = ({ api }) => {
  const [activeStatus, setActiveStatus] = useState<string>(
    api.responses[0].status,
  );

  const activeResponse = api.responses.find((r) => r.status === activeStatus);

  return (
    <div className="w-full lg:w-[70%] space-y-6 mx-1 ">
      <div>
        <Typography variant="h3" className="pb-4" align="left">
          {api.name}
        </Typography>
        <Typography variant="body" color="gray" align="left">
          {api.description}
        </Typography>
      </div>

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

      {/* Response Section */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#4B4A4A] w-full">
          <Typography variant="h4" align="left">
            Response
          </Typography>
          {/* Use custom Dropdown component */}
          <Dropdown
            className="w-[500px]"
            label=""
            options={api.responses.map((res) => ({
              id: res.status,
              name: `${res.status} `,
            }))}
            selectedOption={
              api.responses.find((r) => r.status === activeStatus)
                ? `${activeStatus}`
                : ""
            }
            onChange={(option) => {
              // Extract status code from option.name (format: 'status - description')
              const status = option.id.toString();
              setActiveStatus(status);
            }}
          />
        </div>
        <div className="pt-4">
          {activeResponse &&
            (Array.isArray(activeResponse.content) ? (
              <div className="space-y-4">
                {(activeResponse.content as ApiParameter[]).map((param) => (
                  <div
                    key={param.name}
                    className="border-b border-[#4B4A4A] pb-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Typography variant="span" color="error">
                        {param.name}
                      </Typography>
                      <Typography variant="span" color="success">
                        {param.type}
                      </Typography>
                    </div>
                    <Typography variant="body" color="gray" align="left">
                      {param.description}
                    </Typography>
                  </div>
                ))}
              </div>
            ) : (
              // Render if content is a ReactNode (like for error messages)
              <div>{activeResponse.content}</div>
            ))}
        </div>
      </div>

      {/* Request and Response Sample viewers can be added here similarly */}
    </div>
  );
};

export default ApiDetailView;
