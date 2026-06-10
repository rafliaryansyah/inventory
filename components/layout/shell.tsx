"use client";

import { useState } from "react";
import { ToastProvider } from "@/components/layout/toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar, type TopbarUser } from "@/components/layout/topbar";
import type { NotifItem } from "@/components/modals/notification-dropdown";

export function Shell({
  user,
  notifications,
  unreadCount,
  children,
}: {
  user: TopbarUser;
  notifications: NotifItem[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-warm">
        <Sidebar
          role={user.role}
          open={navOpen}
          onClose={() => setNavOpen(false)}
        />
        <div className="lg:pl-64">
          <Topbar
            user={user}
            notifications={notifications}
            unreadCount={unreadCount}
            onMenu={() => setNavOpen(true)}
          />
          <main className="mx-auto max-w-[1280px] px-5 py-8 md:px-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
