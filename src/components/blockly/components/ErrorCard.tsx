import React from "react";
import { Card } from "../../ui/Card";

interface ErrorCardProps {
  error: string | null;
  onClose: () => void;
}

export function ErrorCard({ error, onClose }: ErrorCardProps) {
  if (!error) return null;

  return (
    <Card className="!border-red-500 !bg-red-500/10 mt-4">
      <div className="flex items-start gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <p className="text-red-500 text-sm sm:text-base font-medium">
            Validation Error
          </p>
          <p className="text-red-400 text-xs sm:text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-300 transition-colors"
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
