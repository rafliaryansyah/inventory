"use client";

import Image from "next/image";
import { useActionState } from "react";
import { LogIn, AlertCircle } from "lucide-react";
import { authenticate, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const DEMO = [
  { role: "Karyawan", email: "budi@handal.co.id" },
  { role: "Manager", email: "bambang@handal.co.id" },
  { role: "HRD", email: "hrd@handal.co.id" },
  { role: "Admin Aset", email: "siti@handal.co.id" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    authenticate,
    undefined,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm px-5 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="Handal Informasi Teknologi"
            width={160}
            height={128}
            priority
            className="h-auto w-32"
          />
          <span className="display-serif text-3xl">AssetFlow</span>
        </div>

        <div className="rounded-xl border border-line bg-paper p-7 shadow-soft">
          <p className="eyebrow text-amber-dk">Masuk</p>
          <h1 className="display-serif mt-1 text-2xl">
            Selamat datang <span className="italic text-amber">kembali</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Sistem Informasi Manajemen Aset — PT Handal Informasi Teknologi.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@handal.co.id"
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </Field>

            {state?.error && (
              <div className="flex items-center gap-2 rounded-md bg-rust-sf px-3 py-2.5 text-sm text-rust">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={pending}
              icon={<LogIn className="h-4 w-4" />}
            >
              Masuk
            </Button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-5 rounded-lg border border-line bg-paper/60 p-4">
          <p className="eyebrow text-ink-mute mb-2">Kredensial Demo</p>
          <ul className="space-y-1 text-xs text-ink-soft">
            {DEMO.map((d) => (
              <li key={d.email} className="flex justify-between">
                <span>{d.role}</span>
                <span className="font-mono">{d.email}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-mute">
            Password semua akun: <span className="font-mono">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
