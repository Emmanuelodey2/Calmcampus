import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { LoadingProvider } from "@/components/ui/loading-provider";

export const metadata: Metadata = {
  title: "CalmCampus",
  description: "AI-assisted mental health support for Pan-Atlantic University undergraduates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          <LoadingProvider>{children}</LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
