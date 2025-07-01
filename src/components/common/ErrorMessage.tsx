import { forwardRef } from "react";
import { Typography } from "../../components/ui/Typography";

interface ErrorMessageProps {
  error: string | null;
  className?: string;
  emoji?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorMessage = forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ error, emoji }, ref) => {
    if (!error) return null;

    // Define a default retry handler that refreshes the page

    return (
      <div
        ref={ref}
        className="flex flex-col items-center justify-center h-[300px] text-[#A2A2A2] w-full col-span-full"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-4"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
        <div className="flex items-center gap-2 mb-2">
          {emoji && <span className="text-lg">{emoji}</span>}
          <Typography variant="h4" color="gray" className="!mb-0">
            {error}
          </Typography>
        </div>
        <Typography variant="body" color="gray" className="text-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline transition-all underline-offset-4 hover:text-[#F8ff7c]/80 "
          >
            Try again !
          </button>
        </Typography>
      </div>
    );
  },
);

ErrorMessage.displayName = "ErrorMessage";
