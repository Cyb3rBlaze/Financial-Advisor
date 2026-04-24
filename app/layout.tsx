import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ethos Ledger",
  description: "Private financial planning cockpit for lifecycle strategy modeling."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
