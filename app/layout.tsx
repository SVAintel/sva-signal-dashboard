import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVA Signal Dashboard",
  description: "Real-time global event intelligence with AI analyst insights",
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
