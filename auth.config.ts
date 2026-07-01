import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";
import { resolveBaseUrl } from "@/lib/site";

// Normalisasi AUTH_URL SEBELUM NextAuth membacanya. NextAuth v5 memanggil
// `new URL(process.env.AUTH_URL)` saat init; nilai tanpa scheme / typo bikin
// crash `Invalid URL` di middleware. Kita set ke base URL tervalidasi
// (AUTH_URL → RAILWAY_PUBLIC_DOMAIN). Bila tak ada yang valid, buang env-nya
// supaya `trustHost: true` merekonstruksi dari header — app tetap jalan.
// Side-effect ini dievaluasi saat modul di-load, sebelum `NextAuth(authConfig)`
// dipanggil di middleware.ts & lib/auth.ts.
const resolvedBaseUrl = resolveBaseUrl();
if (resolvedBaseUrl) process.env.AUTH_URL = resolvedBaseUrl;
else delete process.env.AUTH_URL;

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
