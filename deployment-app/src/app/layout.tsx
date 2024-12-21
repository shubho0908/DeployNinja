import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/lib/SessionWrapper";
import { ThemeProvider } from "@/utils/theme-provider";
import { ReduxProvider } from "../redux/ReduxProvider";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeployNinja",
  description: "Deploy your next big idea in minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ReduxProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Toaster />
          <SessionWrapper>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Navbar />
              <section>{children}</section>
            </ThemeProvider>
          </SessionWrapper>
        </body>
      </ReduxProvider>
    </html>
  );
}
