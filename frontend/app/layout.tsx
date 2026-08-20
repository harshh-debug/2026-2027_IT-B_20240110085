import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OBE Management System",
  description: "Outcome-Based Education management for the KIET IT department",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}