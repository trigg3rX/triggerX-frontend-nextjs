import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";
import { TGBalanceProvider } from "@/contexts/TGBalanceContext";
import { TooltipProvider } from "@/components/common/TooltipWrap";
import Header from "@/components/common/Header";
import ScrollToTop from "@/components/common/ScrollToTop";
import Footer from "@/components/common/Footer";

export const metadata: Metadata = {
  title: "TriggerX",
  description: "Automate Tasks Effortlessly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stakeRegistryAddress =
    process.env.NEXT_PUBLIC_TRIGGER_GAS_REGISTRY_ADDRESS || "";
  return (
    <html lang="en">
      <body className={`antialiated font-actay`}>
        <TooltipProvider>
          <Providers>
            <TGBalanceProvider stakeRegistryAddress={stakeRegistryAddress}>
              <Header />
              <ScrollToTop />
              <main className="max-w-[1600px] w-[90%] mx-auto mt-[120px] sm:mt-[150px] lg:mt-[270px] min-h-[500px] relative z-40">
                {children}
              </main>
              <Footer />
            </TGBalanceProvider>
          </Providers>
          <Toaster
            position="bottom-center"
            toastOptions={{ style: { zIndex: 2147483647 } }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
