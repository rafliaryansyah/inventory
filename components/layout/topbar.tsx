"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Search, ChevronDown, LogOut } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Avatar } from "@/components/ui/avatar";
import {
  NotificationDropdown,
  type NotifItem,
} from "@/components/modals/notification-dropdown";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<UserRole, string> = {
  KARYAWAN: "Karyawan",
  ADMIN_ASET: "Admin Aset",
  MANAGER: "Manager",
  HRD: "HRD",
};

export type TopbarUser = {
  name: string;
  email: string;
  role: UserRole;
  division?: string | null;
  avatarColor?: string | null;
};

export function Topbar({
  user,
  notifications,
  unreadCount,
  onMenu,
}: {
  user: TopbarUser;
  notifications: NotifItem[];
  unreadCount: number;
  onMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-warm/80 px-5 backdrop-blur-md md:px-8">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-md p-2 text-ink-soft hover:bg-paper hover:text-ink lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search (decorative quick search) */}
      <div className="relative hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
        <input
          type="search"
          placeholder="Cari…"
          className="!pl-9 !py-2 !bg-paper"
          aria-label="Cari"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

function UserMenu({ user }: { user: TopbarUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-paper"
      >
        <Avatar name={user.name} color={user.avatarColor} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-ink">
            {user.name}
          </span>
          <span className="block text-xs leading-tight text-ink-mute">
            {ROLE_LABEL[user.role]}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-ink-mute" />
      </button>

      {open && (
        <div className="anim-scale absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-line bg-paper shadow-lift">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-medium text-ink">{user.name}</p>
            <p className="truncate text-xs text-ink-mute">{user.email}</p>
            {user.division && (
              <p className="mt-1 text-xs text-ink-soft">{user.division}</p>
            )}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className={cn(
                "flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-rust transition-colors hover:bg-rust-sf",
              )}
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
