"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "@/store/SessionContext";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }));

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <title>AuraJobs - Multi-Agent AI Job Automation</title>
        <meta name="description" content="AI scans thousands of fresher jobs, understands your resume, analyzes your skills, and matches you to perfect opportunities automatically." />
      </head>
      <body className="min-h-full flex flex-col transition-colors duration-300 selection:bg-sky-500/20 selection:text-sky-200">
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <UserProvider>
              {children}
              <Toaster position="top-right" richColors closeButton theme="dark" />
            </UserProvider>
          </SessionProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
