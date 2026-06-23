"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Users,
  MoreVertical,
  Eye,
  Pencil,
  UserCheck,
  UserX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { KaryawanAvatar } from "@/components/ui/karyawan-avatar";
import {
  EmployeeFormModal,
  type EmployeeFormTarget,
} from "@/components/modals/employee-form-modal";
import { EmployeeDetailModal } from "@/components/modals/employee-detail-modal";
import { useToast } from "@/components/layout/toast";
import { setEmployeeActive } from "@/actions/users";
import type { EmployeeRow } from "@/lib/queries/users";

const ROLES = [
  { value: "KARYAWAN", label: "Karyawan" },
  { value: "ADMIN_ASET", label: "Admin Aset" },
  { value: "MANAGER", label: "Manager" },
  { value: "HRD", label: "HRD" },
];
const PAGE_SIZE = 8;

export function MasterKaryawanClient({
  employees,
}: {
  employees: EmployeeRow[];
}) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [formTarget, setFormTarget] = useState<EmployeeFormTarget>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (role && e.role !== role) return false;
      if (status === "AKTIF" && !e.isActive) return false;
      if (status === "NONAKTIF" && e.isActive) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [employees, search, role, status]);

  useEffect(() => {
    setPage(0);
  }, [search, role, status]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const pageItems = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email…"
            className="!pl-9"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="sm:w-40"
          aria-label="Filter role"
        >
          <option value="">Semua Role</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:w-36"
          aria-label="Filter status"
        >
          <option value="">Semua Status</option>
          <option value="AKTIF">Aktif</option>
          <option value="NONAKTIF">Nonaktif</option>
        </select>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormTarget("new")}>
          Tambah Karyawan
        </Button>
      </div>

      <Card padless>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Tidak ada karyawan"
            description="Sesuaikan pencarian/filter atau tambah karyawan baru."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-5 py-3" />
                    <th className="eyebrow px-5 py-3 text-ink-mute">Nama</th>
                    <th className="eyebrow px-5 py-3 text-ink-mute">Role</th>
                    <th className="eyebrow px-5 py-3 text-ink-mute">Divisi</th>
                    <th className="eyebrow px-5 py-3 text-right text-ink-mute">Aset</th>
                    <th className="eyebrow px-5 py-3 text-ink-mute">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((e) => (
                    <tr key={e.id} className="border-b border-line/60 last:border-0">
                      <td className="py-3 pl-5">
                        <KaryawanAvatar size="sm" active={e.isActive} />
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-ink">{e.name}</span>
                        <span className="block text-xs text-ink-mute">{e.email}</span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge status={e.role} />
                      </td>
                      <td className="px-5 py-3 text-ink-soft">{e.division ?? "—"}</td>
                      <td className="px-5 py-3 text-right font-mono">
                        {e._count.assetsAssigned}
                      </td>
                      <td className="px-5 py-3">
                        <Badge status={e.isActive ? "AKTIF" : "NONAKTIF"} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <RowMenu
                          employee={e}
                          onDetail={() => setDetailId(e.id)}
                          onEdit={() => setFormTarget(e)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && (
              <div className="border-t border-line px-4 py-3">
                <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      <EmployeeFormModal target={formTarget} onClose={() => setFormTarget(null)} />
      <EmployeeDetailModal
        employeeId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

function RowMenu({
  employee,
  onDetail,
  onEdit,
}: {
  employee: EmployeeRow;
  onDetail: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onClick = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggleActive = () => {
    setOpen(false);
    start(async () => {
      const res = await setEmployeeActive(employee.id, !employee.isActive);
      if (res.ok) {
        toast.success(res.message ?? "Status diperbarui.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-warm hover:text-ink disabled:opacity-50"
        aria-label="Aksi karyawan"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="anim-scale absolute right-0 z-20 mt-1 w-48 origin-top-right overflow-hidden rounded-lg border border-line bg-paper shadow-lift">
          <MenuItem icon={<Eye className="h-4 w-4" />} onClick={() => { setOpen(false); onDetail(); }}>
            Lihat Detail
          </MenuItem>
          <MenuItem icon={<Pencil className="h-4 w-4" />} onClick={() => { setOpen(false); onEdit(); }}>
            Edit
          </MenuItem>
          {employee.isActive ? (
            <MenuItem icon={<UserX className="h-4 w-4" />} onClick={toggleActive}>
              Nonaktifkan
            </MenuItem>
          ) : (
            <MenuItem icon={<UserCheck className="h-4 w-4" />} onClick={toggleActive}>
              Aktifkan
            </MenuItem>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-warm hover:text-ink"
    >
      {icon}
      {children}
    </button>
  );
}
