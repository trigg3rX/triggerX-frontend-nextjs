import React from "react";
import { LucideCopyButton } from "../ui/CopyButton";
import { Card } from "../ui/Card";

export interface CodeBlockWithCopyProps {
  code: string;
  className?: string;
}

const CodeBlockWithCopy: React.FC<CodeBlockWithCopyProps> = ({
  code,
  className = "",
}) => (
  <Card
    className={`flex items-center justify-between ${className} !p-3 !sm:p-6`}
  >
    <pre className="text-[#A2A2A2] text-sm whitespace-pre-wrap break-all max-w-full overflow-x-auto">
      {code}
    </pre>
    <LucideCopyButton text={code} />
  </Card>
);

export { CodeBlockWithCopy };
export default CodeBlockWithCopy;
