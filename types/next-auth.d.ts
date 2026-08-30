import type { DefaultSession } from "next-auth";

// Augments NextAuth's built-in types so `session.user.id` and the JWT
// `token.id` set in lib/auth.ts's callbacks are recognized by TypeScript —
// by default NextAuth's Session/User/JWT types don't know about the extra
// `id` field we attach.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
