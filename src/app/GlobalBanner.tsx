"use client";

import React from "react";

interface GlobalBannerProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function GlobalBanner({
  visible,
  setVisible,
}: GlobalBannerProps) {
  if (!visible) return null;

  return (
    <div className="md:fixed lg:block md:hidden hidden top-0 left-0 w-full z-[1000] bg-yellow-100 text-yellow-900 border-b border-yellow-300">
      <div className="flex items-center justify-center relative px-4 py-2 mx-auto">
        <button
          onClick={() => setVisible(false)}
          className="absolute right-4 text-yellow-900 font-bold text-lg"
          aria-label="Close banner"
        >
          ×
        </button>
        <p className="font-medium text-center">
          🚀 Early Access :
          <span className="font-bold"> TriggerX Mainnet Beta </span> - Be among
          the first to use it - avoid high-value transactions until full launch.
        </p>
      </div>
    </div>
  );
}
