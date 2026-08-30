"use client";

import { SessionProvider } from "next-auth/react";

// Thin client-component wrapper so app/layout.tsx (a server component) can
// still provide NextAuth's session context to the whole tree — SessionProvider
// itself requires "use client" and can't be used directly inside a server
// component's JSX.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
