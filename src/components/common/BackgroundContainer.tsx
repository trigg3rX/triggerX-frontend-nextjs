import React from "react";

interface BackgroundContainerProps {
  children: React.ReactNode;
  className?: string;
}

const BackgroundContainer: React.FC<BackgroundContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={`bg-[#141414] p-3 sm:p-7 rounded-lg overflow-auto ${className || ""}`}
    >
      {children}
    </div>
  );
};

export default BackgroundContainer;
