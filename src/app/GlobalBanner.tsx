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
    <div className="fixed  top-0 left-0 w-full z-[1000] bg-yellow-100 text-yellow-900 border-b border-yellow-300">
      <div className="flex items-center justify-center relative px-4 py-2 mx-auto gap-3">
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 text-yellow-900 font-bold text-lg"
          aria-label="Close banner"
        >
          ×
        </button>
        <p
          color="black"
          className="mx-4 font-medium text-center text-[6px] sm:text-[10px] md:text-[10px] lg:text-[15px]"
        >
          🚀 Early Access :
          <span className="font-bold"> TriggerX Mainnet Beta </span> - Be among
          the first to use it - avoid high-value transactions until full launch.
        </p>
      </div>
    </div>
  );
}
