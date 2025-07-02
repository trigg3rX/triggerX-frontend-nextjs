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
    <>
      <div className="flex items-center justify-between">
        <Typography variant="h4">API Request</Typography>
      </div>

      <Card variant="soft" className="p-4 bg-[#242424] !border-0">
        {activeSample && (
          <pre className="text-[10px] xs:text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap text-[#E6E6E6] mt-4">
            {activeSample.code}
          </pre>
        )}
      </Card>
    </>
  );
};

export default ApiRequestCodeBlock;
