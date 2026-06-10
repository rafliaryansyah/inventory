import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

// Edge-safe base config (no DB / bcrypt imports). Shared by the middleware
// instance and the full Node config in `lib/auth.ts`.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [], // real Credentials provider lives in lib/auth.ts (Node runtime)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.division = user.division ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.division = (token.division as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
