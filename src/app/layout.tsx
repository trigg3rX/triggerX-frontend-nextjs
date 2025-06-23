import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import { Toaster } from "react-hot-toast";
import { TGBalanceProvider } from "@/contexts/TGBalanceContext";

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
        <Providers>
          <TGBalanceProvider stakeRegistryAddress={stakeRegistryAddress}>
            <Header />
            <main className="max-w-[1600px] mx-auto mt-[120px] sm:mt-[150px] lg:mt-[270px] min-h-[500px] relative z-40">
              {children}
            </main>
            <Footer />
            <Toaster position="bottom-center" />
          </TGBalanceProvider>
        </Providers>
      </body>
    </html>
  );
}
