import "~/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata, type Viewport } from "next";
import { ToastContainer } from "react-toastify";

import { TRPCReactProvider } from "~/trpc/react";
import { Providers } from "./providers";
import { Navbar } from "./_components/Navbar";

export const metadata: Metadata = {
  title: "VoiceDraft",
  description: "Speak your idea. Send it anywhere.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} dark`}>
      <body className="min-h-screen bg-background font-sans text-foreground">
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
