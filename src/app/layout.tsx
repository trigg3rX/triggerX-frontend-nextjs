import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import Providers from "./providers";
import { WalletProvider } from "@/contexts/WalletContext";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

export const metadata: Metadata = {
  title: "TriggerX",
  description: "Automate Tasks Effortlessly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased font-actay`}>
        <WalletProvider>
          <Providers>
            <Header />
            <main className="max-w-[1600px] mx-auto mt-[270px] min-h-[500px]">
              {children}
            </main>
            <Footer />
          </Providers>
        </WalletProvider>
      </body>
    </html>
  );
}
