"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/common/Header";
import ScrollToTop from "@/components/common/ScrollToTop";
import StickySocialIcons from "@/components/common/StickySocialIcons";
import MainWrapper from "@/components/common/MainWrapper";
import Footer from "@/components/common/Footer";

interface LayoutChromeProps {
  children: ReactNode;
}

export function LayoutChrome({ children }: LayoutChromeProps) {
  const pathname = usePathname();
  const isVisualJobBuilder = pathname === "/visual-job-builder";

  if (isVisualJobBuilder) {
    return (
      <main className="w-full min-h-screen">
        <div className="w-[95%] max-w-[1600px] mx-auto py-6">{children}</div>
      </main>
    );
  }

  return (
    <>
      <Header />
      <ScrollToTop />
      <StickySocialIcons />
      <MainWrapper>{children}</MainWrapper>
      <Footer />
    </>
  );
}
