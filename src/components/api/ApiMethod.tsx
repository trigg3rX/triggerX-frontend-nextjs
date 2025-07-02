import React from "react";
import clsx from "clsx";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiMethodPillProps {
  method: HttpMethod;
}

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-blue-500",
  POST: "bg-green-500",
  PUT: "bg-yellow-500",
  DELETE: "bg-red-500",
};

const ApiMethod: React.FC<ApiMethodPillProps> = ({ method }) => {
  return (
    <span
      className={clsx(
        "text-[10px] sm:text-xs px-2 py-1.5 sm:px-4 sm:py-2 rounded-full w-30px sm:w-[60px]",
        methodColors[method],
      )}
    >
      {method}
    </span>
  );
};

export default ApiMethod;
