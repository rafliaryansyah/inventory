"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Boxes,
  Truck,
  ShoppingCart,
  QrCode,
  CheckSquare,
  History,
  BarChart3,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: Record<UserRole, NavItem[]> = {
  KARYAWAN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/aset-tersedia", label: "Aset Tersedia", icon: Boxes },
    { href: "/permintaan", label: "Permintaan Saya", icon: FileText },
  ],
  ADMIN_ASET: [
    { href: "/antrian", label: "Antrian Proses", icon: Inbox },
    { href: "/inventori", label: "Inventori", icon: Boxes },
    { href: "/delivery-notes", label: "Delivery Notes", icon: Truck },
    { href: "/pengadaan", label: "Pengadaan", icon: ShoppingCart },
    { href: "/master-aset", label: "Master Aset", icon: QrCode },
    { href: "/master-karyawan", label: "Master Karyawan", icon: Users },
  ],
  MANAGER: [
    { href: "/approval", label: "Antrian Approval", icon: CheckSquare },
    { href: "/riwayat", label: "Riwayat Approval", icon: History },
    { href: "/laporan", label: "Laporan & Analytics", icon: BarChart3 },
  ],
  HRD: [
    { href: "/approval-hrd", label: "Antrian Approval", icon: CheckSquare },
    { href: "/riwayat-hrd", label: "Riwayat Approval", icon: History },
    { href: "/master-karyawan", label: "Master Karyawan", icon: Users },
    { href: "/laporan", label: "Laporan & Analytics", icon: BarChart3 },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  KARYAWAN: "Karyawan",
  ADMIN_ASET: "Admin Aset",
  MANAGER: "Manager",
  HRD: "HRD",
};

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: UserRole;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = NAV[role] ?? [];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-paper transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-6">
          <Image
            src="/logo.png"
            alt="Handal Informasi Teknologi"
            width={45}
            height={36}
            priority
            className="h-9 w-auto"
          />
          <span className="display-serif text-xl">AssetFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-amber-sf text-amber-dk"
                    : "text-ink-soft hover:bg-warm hover:text-ink",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-line px-6 py-4">
          <p className="eyebrow text-ink-mute">Peran</p>
          <p className="mt-1 text-sm font-medium text-ink">{ROLE_LABEL[role]}</p>
        </div>
      </aside>
    </>
  );
}
