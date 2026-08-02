import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/layout/shell";

export const metadata: Metadata = {
  title: "Fitness Tracker",
  description: "Personal fitness tracking for an 8-week body transformation program.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
