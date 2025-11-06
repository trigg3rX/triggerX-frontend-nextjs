import React from "react";
import { Typography } from "../../ui/Typography";
import { LucideCopyButton } from "../../ui/CopyButton";

interface PreviewPanelProps {
  humanPreview: string;
  jsonPreview: string;
}

export function PreviewPanel({ humanPreview, jsonPreview }: PreviewPanelProps) {
  return (
    <div className="h-full bg-[#141414] w-[25%] rounded-2xl p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex flex-col h-1/2">
        <div className="flex items-center justify-between">
          <Typography variant="h2" align="left">
            Job Preview
          </Typography>
        </div>
        <pre className="text-sm overflow-auto leading-6 mt-4 p-5 sm:p-6 rounded-2xl bg-[#1C1C1C] whitespace-pre-wrap break-words flex-1">
          {humanPreview}
        </pre>
      </div>

      <div className="flex flex-col h-1/2">
        <div className="flex items-center justify-between">
          <Typography variant="h2" align="left">
            Job JSON
          </Typography>
          <div className="p-1 aspect-square rounded-full bg-[#C07AF6] hover:bg-[#a46be0] transition-colors flex items-center justify-center">
            <LucideCopyButton text={jsonPreview} />
          </div>
        </div>
        <pre className="text-sm overflow-auto leading-6 mt-4 p-5 sm:p-6 rounded-2xl bg-[#1C1C1C] flex-1">
          {jsonPreview}
        </pre>
      </div>
    </div>
  );
}
