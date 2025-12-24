"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function MainWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isVisualJobBuilder = pathname === "/visual-job-builder";

  return (
    <main
      className={`max-w-[1600px] w-[90%] mx-auto min-h-[500px] relative z-40 ${
        isVisualJobBuilder
          ? "mt-[130px]"
          : "mt-[120px] sm:mt-[150px] lg:mt-[270px]"
      }`}
    >
      {children}
    </main>
  );
}
