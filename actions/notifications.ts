"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { toActionError } from "@/lib/action-helpers";
import { ok, fail, type ActionResult } from "@/types";

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/", "layout");
    return ok();
  } catch (e) {
    return fail(toActionError(e));
  }
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
    revalidatePath("/", "layout");
    return ok();
  } catch (e) {
    return fail(toActionError(e));
  }
}
