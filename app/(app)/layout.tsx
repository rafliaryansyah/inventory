import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getNotifications,
  getUnreadCount,
} from "@/lib/queries/notifications";
import { Shell } from "@/components/layout/shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const u = session.user;

  const [dbUser, notifications, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: u.id },
      select: { avatarColor: true },
    }),
    getNotifications(u.id),
    getUnreadCount(u.id),
  ]);

  return (
    <Shell
      user={{
        name: u.name ?? "Pengguna",
        email: u.email ?? "",
        role: u.role,
        division: u.division,
        avatarColor: dbUser?.avatarColor,
      }}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </Shell>
  );
}
