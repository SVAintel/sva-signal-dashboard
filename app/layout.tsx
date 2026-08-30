import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import Providers from "@/components/Providers";

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
      <body>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
