"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/layout/toast";
import { createEmployee, updateEmployee } from "@/actions/users";
import type { EmployeeRow } from "@/lib/queries/users";

export type EmployeeFormTarget = EmployeeRow | "new" | null;

const ROLES = [
  { value: "KARYAWAN", label: "Karyawan" },
  { value: "ADMIN_ASET", label: "Admin Aset" },
  { value: "MANAGER", label: "Manager" },
  { value: "HRD", label: "HRD" },
];
const COLORS = ["navy", "amber", "sage", "rust"];

type FormState = {
  name: string;
  email: string;
  password: string;
  role: string;
  division: string;
  avatarColor: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  password: "",
  role: "KARYAWAN",
  division: "",
  avatarColor: "navy",
  isActive: true,
};

export function EmployeeFormModal({
  target,
  onClose,
}: {
  target: EmployeeFormTarget;
  onClose: () => void;
}) {
  const isEdit = target !== null && target !== "new";
  const [form, setForm] = useState<FormState>(EMPTY);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (isEdit) {
      const e = target as EmployeeRow;
      setForm({
        name: e.name,
        email: e.email,
        password: "",
        role: e.role,
        division: e.division ?? "",
        avatarColor: e.avatarColor ?? "navy",
        isActive: e.isActive,
      });
    } else if (target === "new") {
      setForm(EMPTY);
    }
  }, [target, isEdit]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid =
    form.name.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    (isEdit || form.password.length >= 6);

  const submit = () =>
    start(async () => {
      const res = isEdit
        ? await updateEmployee({
            id: (target as EmployeeRow).id,
            name: form.name,
            email: form.email,
            role: form.role,
            division: form.division || undefined,
            avatarColor: form.avatarColor || undefined,
            isActive: form.isActive,
            password: form.password || undefined,
          })
        : await createEmployee({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            division: form.division || undefined,
            avatarColor: form.avatarColor || undefined,
          });
      if (res.ok) {
        toast.success(res.message ?? "Tersimpan.");
        router.refresh();
        onClose();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      eyebrow="Master Karyawan"
      title={isEdit ? "Edit Karyawan" : "Tambah Karyawan"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button disabled={!valid} loading={pending} onClick={submit}>
            {isEdit ? "Simpan" : "Tambah"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nama" required>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Nama lengkap"
          />
        </Field>
        <Field label="Email" required>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="nama@handal.co.id"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Role" required>
            <select value={form.role} onChange={(e) => set("role", e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Divisi">
            <input
              value={form.division}
              onChange={(e) => set("division", e.target.value)}
              placeholder="mis. IT Support"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Warna Avatar">
            <select
              value={form.avatarColor}
              onChange={(e) => set("avatarColor", e.target.value)}
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Password"
            required={!isEdit}
            hint={isEdit ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
          >
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={isEdit ? "••••••" : "Min. 6 karakter"}
              autoComplete="new-password"
            />
          </Field>
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4"
            />
            Akun aktif (bisa login)
          </label>
        )}
      </div>
    </Modal>
  );
}
