import React from "react";
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
    <>
      <div className="flex items-center justify-between">
        <Typography variant="h4">{title}</Typography>
      </div>
      {/* Status Code Tabs */}
      <div className="flex border-b border-[#333333] overflow-x-auto">
        {statuses.map((status) => (
          <button
            key={status.code}
            onClick={() => setActiveStatus(status.code)}
            className={`px-4 py-2 text-[10px] xs:text-xs sm:text-sm font-medium flex items-center gap-2 rounded-t-lg ${
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
      <div className="p-4 bg-[#242424] rounded-b-lg text-[10px] xs:text-xs sm:text-sm ">
        <pre className="overflow-x-auto whitespace-pre-wrap text-[#E6E6E6] my-4">
          {responseContent[activeStatus]}
        </pre>
      </div>
    </>
  );
};

export default ApiResponseCodeBlock;
