import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import type { UserRole } from "@prisma/client";

const { auth } = NextAuth(authConfig);

// Landing page per role after login.
const LANDING: Record<UserRole, string> = {
  KARYAWAN: "/dashboard",
  ADMIN_ASET: "/antrian",
  MANAGER: "/approval",
};

// Route prefix → roles allowed (PLAN §7.2).
const ACCESS: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/dashboard", roles: ["KARYAWAN"] },
  { prefix: "/permintaan", roles: ["KARYAWAN"] },
  { prefix: "/antrian", roles: ["ADMIN_ASET"] },
  { prefix: "/inventori", roles: ["ADMIN_ASET"] },
  { prefix: "/delivery-notes", roles: ["ADMIN_ASET"] },
  { prefix: "/pengadaan", roles: ["ADMIN_ASET"] },
  { prefix: "/master-aset", roles: ["ADMIN_ASET"] },
  { prefix: "/approval", roles: ["MANAGER"] },
  { prefix: "/riwayat", roles: ["MANAGER"] },
  { prefix: "/laporan", roles: ["MANAGER"] },
];

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const user = req.auth?.user;
  const isLogin = path === "/login";

  // Not signed in.
  if (!user) {
    if (isLogin) return NextResponse.next();
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.role as UserRole;
  const landing = LANDING[role] ?? "/dashboard";

  // Signed in but on root or login → role landing.
  if (isLogin || path === "/") {
    return NextResponse.redirect(new URL(landing, nextUrl));
  }

  // Enforce role access matrix.
  const rule = ACCESS.find(
    (r) => path === r.prefix || path.startsWith(r.prefix + "/"),
  );
  if (rule && !rule.roles.includes(role)) {
    return NextResponse.redirect(new URL(landing, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on app routes; skip API, static assets, and files with extensions.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
