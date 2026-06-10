"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Inbox,
  CheckCircle2,
  XCircle,
  FileText,
  PackageCheck,
  AlertTriangle,
} from "lucide-react";
import type { NotifType } from "@prisma/client";
import { markAllNotificationsRead } from "@/actions/notifications";
import { cn } from "@/lib/utils";

export type NotifItem = {
  id: string;
  title: string;
  message: string;
  type: NotifType;
  isRead: boolean;
  createdAt: Date | string;
};

const ICONS: Record<NotifType, React.ReactNode> = {
  NEW_REQUEST: <Inbox className="h-4 w-4 text-navy" />,
  APPROVED: <CheckCircle2 className="h-4 w-4 text-sage" />,
  REJECTED: <XCircle className="h-4 w-4 text-rust" />,
  DN_READY: <FileText className="h-4 w-4 text-amber-dk" />,
  ASSET_RECEIVED: <PackageCheck className="h-4 w-4 text-sage" />,
  LOW_STOCK: <AlertTriangle className="h-4 w-4 text-amber-dk" />,
};

function timeAgo(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} mnt lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  return `${day} hr lalu`;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
}: {
  notifications: NotifItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-ink-soft transition-colors hover:bg-warm hover:text-ink"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rust px-1 text-[10px] font-semibold text-paper">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-scale absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-xl border border-line bg-paper shadow-lift">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="eyebrow text-ink-soft">Notifikasi</p>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                disabled={pending}
                className="text-xs font-medium text-amber-dk hover:underline disabled:opacity-50"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink-mute">
                Belum ada notifikasi.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 border-b border-line/60 px-4 py-3 last:border-0",
                    !n.isRead && "bg-amber-sf/20",
                  )}
                >
                  <span className="mt-0.5 shrink-0">{ICONS[n.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{n.message}</p>
                    <p className="mt-1 font-mono text-[10px] text-ink-mute">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
