import type { Metadata } from "next";
import { ClerkProvider, UserButton } from '@clerk/nextjs';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Knowledge Assistant",
  description: "Intelligent RAG chatbot for private document knowledge bases.",
  manifest: "/manifest.json",
  themeColor: "#0b0f19",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Knowledge Assistant",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
          <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="AI Assistant" />
          <meta name="application-name" content="AI Assistant" />
          <meta name="theme-color" content="#0b0f19" />
        </head>
        <body className="min-h-full flex flex-col selection:bg-blue-600/30 selection:text-blue-200">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
