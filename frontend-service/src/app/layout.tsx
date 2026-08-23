import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operations ERP | Workflow System",
  description: "Enterprise Docket & Workflow Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="bg-[#f6f8fa] text-[#24292f] font-sans text-xs antialiased selection:bg-[#c8e1ff]"
      >
        {children}
      </body>
    </html>
  );
}
