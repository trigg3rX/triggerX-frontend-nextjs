import React, { useState } from "react";
import { ApiRequestSample } from "@/data/apiData";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";

interface ApiRequestCodeBlock {
  requestSamples: ApiRequestSample[]; // Array to support multiple languages
}

const ApiRequestCodeBlock: React.FC<ApiRequestCodeBlock> = ({
  requestSamples,
}) => {
  const [activeLanguage] = useState(requestSamples[0].language);

  const activeSample = requestSamples.find(
    (sample) => sample.language === activeLanguage,
  );

  return (
    <Card>
      <div className="flex items-center justify-between p-4 border-b border-[#333333]">
        <Typography variant="h5">API Request</Typography>
      </div>

      <div className="p-4 bg-[#242424] overflow-auto">
        {activeSample && (
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap text-[#E6E6E6] mt-4">
            {activeSample.code}
          </pre>
        )}
      </div>
    </Card>
  );
};

export default ApiRequestCodeBlock;
