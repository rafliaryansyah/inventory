// Shared types / view models.

export type {
  UserRole,
  Urgency,
  RequestStatus,
  AssetStatus,
  StockStatus,
  DnStatus,
  PoStatus,
  NotifType,
} from "@prisma/client";

/** Standard return shape for every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

export function ok<T>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}
