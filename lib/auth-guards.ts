import { auth } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

/** Thrown when a request is unauthenticated or lacks the required role. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
  division?: string | null;
};

/** Returns the current session user, or null if not signed in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser | undefined) ?? null;
}

/** Ensures a user is signed in. Throws AuthError otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Anda harus login terlebih dahulu.");
  return user;
}

/** Ensures the signed-in user has one of the given roles (defense in depth). */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (roles.length && !roles.includes(user.role)) {
    throw new AuthError("Anda tidak memiliki akses untuk aksi ini.");
  }
  return user;
}
