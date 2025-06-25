import React from "react";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";

interface Status {
  code: string;
  color: string;
}

interface ApiResponseCodeBlockProps {
  statuses: Status[];
  activeStatus: string;
  setActiveStatus: (code: string) => void;
  responseContent: Record<string, React.ReactNode>;
  title?: string;
}

const ApiResponseCodeBlock: React.FC<ApiResponseCodeBlockProps> = ({
  statuses,
  activeStatus,
  setActiveStatus,
  responseContent,
  title = "Response",
}) => {
  return (
    <Card>
      <div className="flex items-center justify-between p-4 border-b border-[#333333]">
        <Typography variant="h5" className="text-xl font-bold">
          {title}
        </Typography>
      </div>
      {/* Status Code Tabs */}
      <div className="flex border-b border-[#333333] overflow-scroll md:overflow-hidden">
        {statuses.map((status) => (
          <button
            key={status.code}
            onClick={() => setActiveStatus(status.code)}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
              activeStatus === status.code
                ? "bg-[#242424] text-white"
                : "text-gray-400 hover:text-white hover:bg-[#242424]/50"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
            {status.code}
          </button>
        ))}
      </div>
      <div className="p-4 bg-[#242424]">
        <pre className="text-sm overflow-x-auto whitespace-pre-wrap text-[#E6E6E6] mt-4">
          {responseContent[activeStatus]}
        </pre>
      </div>
    </Card>
  );
};

export default ApiResponseCodeBlock;
