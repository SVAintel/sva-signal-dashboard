import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db";

// Email/password auth backed by the project's existing Neon/Vercel Postgres
// database (see lib/db.ts) rather than a separate auth provider — keeps
// account data in the same place as everything else, no extra service to
// configure. Sessions are JWT-based (no `sessions` table needed): the user's
// id/email are encoded into the token itself and read back out in the
// `session` callback below.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    // We use a custom in-header sign-in widget (components/AuthWidget.tsx)
    // instead of NextAuth's default hosted page, but this still needs to
    // point somewhere valid for edge cases (e.g. a bad/expired session
    // redirect) — sending users back to the root is fine since the widget
    // lives there.
    signIn: "/",
    error: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await getUserByEmail(credentials.email);
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
