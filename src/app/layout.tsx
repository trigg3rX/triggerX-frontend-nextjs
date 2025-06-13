import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import { Toaster } from "react-hot-toast";

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
      <body className={`antialiated font-actay`}>
        <Providers>
          <Header />
          <main className="max-w-[1600px] mx-auto mt-[120px] sm:mt-[150px] lg:mt-[270px] min-h-[500px]">
            {children}
          </main>
          <Footer />
          <Toaster position="bottom-center" />
        </Providers>
      </body>
    </html>
  );
}
