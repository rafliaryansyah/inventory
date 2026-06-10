"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eraser } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/layout/toast";
import { signDeliveryNote } from "@/actions/delivery-notes";

export function SignatureModal({
  open,
  onClose,
  dnId,
  dnNumber,
  recipientName,
}: {
  open: boolean;
  onClose: () => void;
  dnId: string;
  dnNumber: string;
  recipientName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1A1F2E";
    }
    setHasInk(false);
  }, [open]);

  const point = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: React.PointerEvent) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };
  const onUp = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const save = () =>
    start(async () => {
      const canvas = canvasRef.current;
      if (!canvas || !hasInk) {
        toast.error("Tanda tangan masih kosong.");
        return;
      }
      const signatureData = canvas.toDataURL("image/png");
      const res = await signDeliveryNote({ dnId, signatureData });
      if (res.ok) {
        toast.success(res.message ?? "Delivery Note ditandatangani.");
        router.refresh();
        onClose();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={dnNumber}
      title="Tanda Tangan Digital"
      size="md"
      footer={
        <>
          <Button variant="ghost" icon={<Eraser className="h-4 w-4" />} onClick={clear}>
            Hapus
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" loading={pending} disabled={!hasInk} onClick={save}>
            Simpan & Selesai
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-soft">
        Penerima: <span className="font-medium text-ink">{recipientName}</span>.
        Tanda tangani di area di bawah ini untuk konfirmasi serah terima aset.
      </p>
      <canvas
        ref={canvasRef}
        className="sig-canvas h-48 w-full"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
      <p className="mt-2 text-center text-xs text-ink-mute">
        Gunakan mouse atau jari untuk menandatangani.
      </p>
    </Modal>
  );
}
