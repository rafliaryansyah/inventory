"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Boxes } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

type AvailAsset = {
  id: string;
  assetCode: string;
  name: string;
  location: string | null;
  category: { name: string };
};

const PAGE_SIZE = 8;

export function AsetTersediaClient({ assets }: { assets: AvailAsset[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(0);

  const categories = useMemo(
    () => Array.from(new Set(assets.map((a) => a.category.name))).sort(),
    [assets],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (category && a.category.name !== category) return false;
      if (q) {
        if (
          !a.assetCode.toLowerCase().includes(q) &&
          !a.name.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [assets, search, category]);

  // Reset ke halaman pertama saat filter berubah.
  useEffect(() => {
    setPage(0);
  }, [search, category]);

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
            placeholder="Cari kode atau nama aset…"
            className="!pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:w-52"
          aria-label="Filter kategori"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-ink-mute">
        <span className="font-medium text-ink-soft">{filtered.length}</span> aset
        tersedia
      </p>

      <Card padless>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-6 w-6" />}
            title="Tidak ada aset tersedia"
            description="Sesuaikan pencarian atau filter kategori."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="eyebrow px-5 py-3 text-ink-mute">Nama</th>
                    <th className="eyebrow px-5 py-3 text-ink-mute">Kode Aset</th>
                    <th className="eyebrow px-5 py-3 text-ink-mute">Lokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-line/60 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <span className="text-ink">{a.name}</span>
                        <span className="block text-xs text-ink-mute">
                          {a.category.name}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {a.assetCode}
                      </td>
                      <td className="px-5 py-3 text-ink-soft">
                        {a.location ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && (
              <div className="border-t border-line px-4 py-3">
                <Pagination
                  page={safePage}
                  pageCount={pageCount}
                  onChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
