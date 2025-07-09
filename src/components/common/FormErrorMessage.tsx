import { forwardRef } from "react";

interface FormErrorMessageProps {
  error: string | null;
  className?: string;
}

export const FormErrorMessage = forwardRef<
  HTMLDivElement,
  FormErrorMessageProps
>(({ error, className = "" }, ref) => {
  if (!error) return null;

  return (
    <div
      ref={ref}
      className={`text-red-500 text-xs sm:text-sm mb-4 ${className}`}
    >
      {error}
    </div>
  );
});

FormErrorMessage.displayName = "FormErrorMessage";
