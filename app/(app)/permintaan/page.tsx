import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getMyRequests } from "@/lib/queries/requests";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClasses } from "@/components/ui/button";
import { PermintaanList } from "@/components/features/karyawan/permintaan-list";

export default async function PermintaanPage() {
  const session = await auth();
  if (!session?.user) return null;
  const requests = await getMyRequests(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Karyawan"
        title={
          <>
            Permintaan <span className="italic text-amber">Saya</span>
          </>
        }
        subtitle="Pantau status seluruh permintaan aset yang Anda ajukan."
        actions={
          <Link href="/permintaan/baru" className={buttonClasses("primary", "md")}>
            <Plus className="h-4 w-4" />
            Ajukan Permintaan
          </Link>
        }
      />
      <PermintaanList requests={requests} />
    </div>
  );
}
