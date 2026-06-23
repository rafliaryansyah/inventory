"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { logAudit } from "@/lib/audit";
import { toActionError } from "@/lib/action-helpers";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "@/lib/validations/user";
import {
  getEmployeeDetail,
  type EmployeeDetail,
} from "@/lib/queries/users";
import { ok, fail, type ActionResult } from "@/types";

export async function fetchEmployeeDetail(
  id: string,
): Promise<ActionResult<EmployeeDetail>> {
  try {
    await requireRole("HRD", "ADMIN_ASET");
    const detail = await getEmployeeDetail(id);
    if (!detail) return fail("Karyawan tidak ditemukan.");
    return ok(detail);
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function createEmployee(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole("HRD", "ADMIN_ASET");
    const data = createEmployeeSchema.parse(input);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        division: data.division || null,
        avatarColor: data.avatarColor || null,
      },
    });

    await logAudit(prisma, {
      userId: user.id,
      action: "CREATE",
      entityType: "User",
      entityId: created.id,
      changes: { email: created.email, role: created.role },
    });

    revalidatePath("/master-karyawan");
    return ok({ id: created.id }, `Karyawan ${created.name} ditambahkan.`);
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function updateEmployee(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireRole("HRD", "ADMIN_ASET");
    const data = updateEmployeeSchema.parse(input);

    const patch: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      role: data.role,
      division: data.division || null,
      avatarColor: data.avatarColor || null,
      isActive: data.isActive,
    };
    if (data.password) {
      patch.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({ where: { id: data.id }, data: patch });

    await logAudit(prisma, {
      userId: user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: data.id,
      changes: { role: data.role, isActive: data.isActive },
    });

    revalidatePath("/master-karyawan");
    return ok(undefined, "Data karyawan diperbarui.");
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function setEmployeeActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    const user = await requireRole("HRD", "ADMIN_ASET");
    if (id === user.id && !active) {
      return fail("Tidak bisa menonaktifkan akun Anda sendiri.");
    }

    await prisma.user.update({ where: { id }, data: { isActive: active } });

    await logAudit(prisma, {
      userId: user.id,
      action: active ? "ACTIVATE" : "DEACTIVATE",
      entityType: "User",
      entityId: id,
    });

    revalidatePath("/master-karyawan");
    return ok(undefined, active ? "Karyawan diaktifkan." : "Karyawan dinonaktifkan.");
  } catch (e) {
    return fail(toActionError(e));
  }
}
