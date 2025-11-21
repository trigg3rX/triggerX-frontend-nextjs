import React from "react";
import { Card } from "../../ui/Card";
import { Typography } from "../../ui/Typography";

interface ErrorCardProps {
  error: string | null;
  onClose: () => void;
}

export function ErrorCard({ error, onClose }: ErrorCardProps) {
  if (!error) return null;

  return (
    <Card className="mt-4 border-l-4 !border-l-red-500 !border-t-white/10 !border-r-white/10 !border-b-white/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Typography variant="h3" color="error" align="left">
            Validation Error
          </Typography>
          <Typography
            variant="body"
            color="secondary"
            align="left"
            className="leading-relaxed"
          >
            {error}
          </Typography>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          aria-label="Close error"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </Card>
  );
}
