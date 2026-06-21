import "~/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata, type Viewport } from "next";
import { ToastContainer } from "react-toastify";

import { TRPCReactProvider } from "~/trpc/react";
import { Providers } from "./providers";
import { Navbar } from "./_components/Navbar";
import { ServiceWorkerRegister } from "./_components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "VoiceDraft",
  description: "Speak your idea. Send it anywhere.",
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/icons/apple-touch-icon.png" },
  ],
  appleWebApp: {
    capable: true,
    title: "VoiceDraft",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f6ef7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} dark`}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ServiceWorkerRegister />
        <TRPCReactProvider>
          <Providers>
            <Navbar />
            <main className="mx-auto max-w-lg px-4 pb-24 pt-4">
              {children}
            </main>
            <ToastContainer
              position="bottom-center"
              autoClose={3000}
              theme="dark"
              className="mb-safe"
            />
          </Providers>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
