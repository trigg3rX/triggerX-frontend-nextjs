"use client";
import { useState } from "react";

export default function GlobalBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[1000] bg-yellow-100 text-yellow-900 border-b border-yellow-300">
      <div className="flex items-center justify-center relative px-4 py-2 max-w-7xl mx-auto">
        {/* Close Button - Left */}
        <button
          onClick={() => setVisible(false)}
          className="absolute right-4 text-yellow-900 hover:text-yellow-700 font-bold text-lg"
          aria-label="Close banner"
        >
          ×
        </button>

        {/* Centered Text */}
        <p className="font-medium text-center">
          🚀 TriggerX is live on <span className="font-bold">Mainnet Beta</span>{" "}
          — please avoid using high-value transactions.
        </p>
      </div>
    </div>
  );
}
