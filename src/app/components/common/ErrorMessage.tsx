import { forwardRef } from "react";

interface ErrorMessageProps {
  error: string | null;
  className?: string;
}

export const ErrorMessage = forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ error, className = "" }, ref) => {
    if (!error) return null;

    return (
      <div
        ref={ref}
        className={`text-red-500 text-xs sm:text-sm mb-4 ${className}`}
      >
        {error}
      </div>
    );
  },
);

ErrorMessage.displayName = "ErrorMessage";
