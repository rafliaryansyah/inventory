"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/layout/toast";
import { submitRequest } from "@/actions/requests";
import { rp } from "@/lib/format";
import { cn } from "@/lib/utils";

const URGENCIES = [
  { value: "RENDAH", label: "Rendah" },
  { value: "NORMAL", label: "Normal" },
  { value: "TINGGI", label: "Tinggi" },
  { value: "KRITIKAL", label: "Kritikal" },
] as const;

const itemForm = z.object({
  categoryId: z.string(),
  itemName: z.string().min(1, "Nama item wajib diisi"),
  quantity: z.coerce.number().int().positive("Qty minimal 1"),
  // Opsional: boleh kosong; kalau diisi harus angka > 0 / URL valid.
  unitPrice: z
    .string()
    .refine((v) => v === "" || Number(v) > 0, "Harga harus angka > 0"),
  buyLink: z.union([
    z.literal(""),
    z.string().url("Link beli harus URL valid (mis. https://…)"),
  ]),
  notes: z.string(),
});

const EMPTY_ITEM = {
  categoryId: "",
  itemName: "",
  quantity: 1,
  unitPrice: "",
  buyLink: "",
  notes: "",
};

const formSchema = z.object({
  reason: z.string().min(10, "Justifikasi minimal 10 karakter"),
  neededDate: z.string().min(1, "Tanggal dibutuhkan wajib diisi"),
  urgency: z.enum(["RENDAH", "NORMAL", "TINGGI", "KRITIKAL"]),
  items: z.array(itemForm).min(1, "Minimal 1 item"),
});

type FormValues = z.infer<typeof formSchema>;

export function RequestForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      reason: "",
      neededDate: "",
      urgency: "NORMAL",
      items: [{ ...EMPTY_ITEM }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const urgency = watch("urgency");
  const watchedItems = watch("items");
  const grandTotal = (watchedItems ?? []).reduce(
    (s, it) => s + (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0),
    0,
  );

  const onSubmit = async (values: FormValues) => {
    const res = await submitRequest({
      reason: values.reason,
      neededDate: values.neededDate,
      urgency: values.urgency,
      items: values.items.map((it) => ({
        categoryId: it.categoryId || undefined,
        itemName: it.itemName,
        quantity: it.quantity,
        unitPrice: it.unitPrice || undefined,
        buyLink: it.buyLink || undefined,
        notes: it.notes || undefined,
      })),
    });
    if (res.ok) {
      toast.success("Permintaan berhasil dikirim.");
      router.push("/permintaan");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
      {/* Informasi Permintaan */}
      <Card className="space-y-5">
        <h2 className="display-serif text-xl">Informasi Permintaan</h2>

        <Field
          label="Justifikasi"
          required
          error={errors.reason?.message}
          hint="Jelaskan alasan dan kebutuhan permintaan ini (min. 10 karakter)."
          htmlFor="reason"
        >
          <textarea
            id="reason"
            rows={3}
            placeholder="Contoh: Laptop lama sering hang dan mengganggu pekerjaan harian…"
            {...register("reason")}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Tanggal Dibutuhkan"
            required
            error={errors.neededDate?.message}
            htmlFor="neededDate"
          >
            <input id="neededDate" type="date" {...register("neededDate")} />
          </Field>

          <Field label="Tingkat Urgensi" required>
            <div className="grid grid-cols-4 gap-1.5">
              {URGENCIES.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() =>
                    setValue("urgency", u.value, { shouldValidate: true })
                  }
                  className={cn(
                    "rounded-md border px-2 py-2 text-xs font-medium transition-colors",
                    urgency === u.value
                      ? "border-amber bg-amber-sf text-amber-dk"
                      : "border-line bg-paper text-ink-soft hover:border-amber/50",
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Card>

      {/* Item yang Diminta */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="display-serif text-xl">Item yang Diminta</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => append({ ...EMPTY_ITEM })}
          >
            Tambah Baris
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, i) => {
            const it = watchedItems?.[i];
            const subtotal =
              (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0);
            const itemErr = errors.items?.[i];
            return (
              <div
                key={field.id}
                className="space-y-2.5 rounded-lg border border-line bg-warm/30 p-3"
              >
                {/* Baris 1 — kategori, nama, qty, hapus */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.6fr_80px_auto]">
                  <select
                    {...register(`items.${i}.categoryId`)}
                    aria-label="Kategori"
                  >
                    <option value="">Kategori…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Nama item"
                    {...register(`items.${i}.itemName`)}
                    aria-label="Nama item"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    {...register(`items.${i}.quantity`)}
                    aria-label="Qty"
                  />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={fields.length === 1}
                    className="flex items-center justify-center rounded-md px-2 text-ink-mute transition-colors hover:bg-rust-sf hover:text-rust disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-mute"
                    aria-label="Hapus baris"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Baris 2 — harga satuan, link beli, catatan */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1.6fr_1fr]">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Harga satuan (opsional)"
                    {...register(`items.${i}.unitPrice`)}
                    aria-label="Harga satuan"
                  />
                  <input
                    type="url"
                    placeholder="https://… (link beli, opsional)"
                    {...register(`items.${i}.buyLink`)}
                    aria-label="Link beli"
                  />
                  <input
                    placeholder="Catatan (opsional)"
                    {...register(`items.${i}.notes`)}
                    aria-label="Catatan"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-rust">
                    {itemErr?.unitPrice?.message ?? itemErr?.buyLink?.message ?? ""}
                  </span>
                  <span className="text-xs text-ink-mute">
                    Subtotal:{" "}
                    <span className="font-mono text-ink-soft">{rp(subtotal)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {errors.items?.message && (
          <p className="text-xs text-rust">{errors.items.message}</p>
        )}

        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm text-ink-soft">Total Estimasi</span>
          <span className="display-serif text-xl text-amber-dk">
            {rp(grandTotal)}
          </span>
        </div>
      </Card>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/90 backdrop-blur-md lg:pl-64">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3 md:px-8">
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm",
              isValid ? "text-sage" : "text-ink-mute",
            )}
          >
            {isValid && <Check className="h-4 w-4" />}
            {isValid ? "Siap dikirim" : "Lengkapi form untuk mengirim"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/permintaan")}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Kirim Permintaan
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
