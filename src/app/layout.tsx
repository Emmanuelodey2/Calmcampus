import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
