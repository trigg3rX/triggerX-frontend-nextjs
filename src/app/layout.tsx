import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { TooltipProvider } from "@/components/common/TooltipWrap";
import Header from "@/components/common/Header";
import ScrollToTop from "@/components/common/ScrollToTop";
import Footer from "@/components/common/Footer";
import StickySocialIcons from "@/components/common/StickySocialIcons";
import { ReactNode } from "react";
import { GoogleTagManager } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "TriggerX",
  description: "Automate Tasks Effortlessly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <GoogleTagManager gtmId="GTM-N23BN7R5" />
      <head>{/* Other <head> content if needed */}</head>
      <body className={`antialiated font-actay`}>
        <TooltipProvider>
          <Providers>
            <BalanceProvider>
              <Header />
              <ScrollToTop />
              <StickySocialIcons />
              <main className="max-w-[1600px] w-[90%] mx-auto mt-[120px] sm:mt-[150px] lg:mt-[270px] min-h-[500px] relative z-40">
                {children}
              </main>
              <Footer />
            </BalanceProvider>
          </Providers>
          <div id="modal-root"></div>
          <Toaster
            position="bottom-center"
            toastOptions={{ style: { zIndex: 2147483647 } }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
