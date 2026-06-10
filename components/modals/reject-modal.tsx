"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/layout/toast";
import { rejectRequest } from "@/actions/requests";

export function RejectModal({
  open,
  onClose,
  requestId,
  requestNumber,
}: {
  open: boolean;
  onClose: () => void;
  requestId: string;
  requestNumber: string;
}) {
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const valid = reason.trim().length >= 10;

  const submit = () =>
    start(async () => {
      const res = await rejectRequest(requestId, { reason });
      if (res.ok) {
        toast.success(res.message ?? "Permintaan ditolak.");
        router.refresh();
        setReason("");
        onClose();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={requestNumber}
      title="Tolak Permintaan"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="rust" disabled={!valid} loading={pending} onClick={submit}>
            Tolak Permintaan
          </Button>
        </>
      }
    >
      <Field
        label="Alasan Penolakan"
        required
        hint={`Minimal 10 karakter — ${reason.trim().length} ditulis`}
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Jelaskan alasan penolakan permintaan ini…"
        />
      </Field>
    </Modal>
  );
}
