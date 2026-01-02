import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { TooltipProvider } from "@/components/common/TooltipWrap";
import { ReactNode } from "react";
import { GoogleTagManager } from "@next/third-parties/google";
import { LayoutChrome } from "@/components/common/LayoutChrome";
import { getNonce } from "@/lib/nonce";

export const metadata: Metadata = {
  title: "TriggerX",
  description: "Automate Tasks Effortlessly",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const nonce = await getNonce();
  return (
    <html lang="en" nonce={nonce || undefined}>
      <GoogleTagManager gtmId="GTM-N23BN7R5" />
      <head>{/* Other <head> content if needed */}</head>
      <body className={`antialiated font-actay`}>
        <TooltipProvider>
          <Providers>
            <BalanceProvider>
              <LayoutChrome>{children}</LayoutChrome>
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
