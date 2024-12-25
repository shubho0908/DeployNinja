import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/lib/SessionWrapper";
import { ThemeProvider } from "@/utils/theme-provider";
import { ReduxProvider } from "../redux/ReduxProvider";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
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
    <html lang="en" className={`${geistSans.className}`}>
      <ReduxProvider>
        <body className={`${geistSans.className} antialiased`}>
          <Toaster />
          <SessionWrapper>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Navbar />
              {children}
            </ThemeProvider>
          </SessionWrapper>
        </body>
      </ReduxProvider>
    </html>
  );
}