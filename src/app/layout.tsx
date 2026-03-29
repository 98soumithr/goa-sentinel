import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Goa Sentinel — Tourism Sentiment Command Centre",
  description: "Real-time reputation defence and tourist sentiment monitoring for Goa Tourism",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0e1a] antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
