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
        "px-2 py-1 rounded-full text-[10px] lg:text-xs text-center min-w-[50px] lg:min-w-[60px]",
        methodColors[method],
      )}
    >
      {method}
    </span>
  );
};

export default ApiMethod;
