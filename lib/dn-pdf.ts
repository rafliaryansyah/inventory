import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDate } from "@/lib/format";

export type DnPdfData = {
  dnNumber: string;
  createdAt: Date | string;
  recipientName: string;
  recipientDivision?: string | null;
  creatorName: string;
  requestNumber: string;
  signedAt?: Date | string | null;
  items: { assetCode: string; name: string; category: string }[];
};

const INK = rgb(0.1, 0.12, 0.18);
const MUTE = rgb(0.48, 0.5, 0.56);
const AMBER = rgb(0.72, 0.52, 0.17);
const LINE = rgb(0.85, 0.82, 0.72);

/** Build a simple printable Delivery Note PDF (for upload to R2). */
export async function buildDeliveryNotePdf(
  data: DnPdfData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const M = 50;
  let y = height - M;

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 10,
    f = font,
    color = INK,
  ) => page.drawText(s, { x, y: yy, size, font: f, color });

  // Header
  text("PT HANDAL INFORMASI TEKNOLOGI", M, y, 14, bold);
  y -= 16;
  text("Delivery Note — Serah Terima Aset", M, y, 10, font, MUTE);
  text("AssetFlow", width - M - 70, height - M, 16, bold, AMBER);
  y -= 24;
  page.drawLine({
    start: { x: M, y },
    end: { x: width - M, y },
    thickness: 1,
    color: LINE,
  });
  y -= 26;

  // Reference grid
  const col2 = width / 2 + 10;
  text("NOMOR DN", M, y, 8, bold, MUTE);
  text("TANGGAL", col2, y, 8, bold, MUTE);
  y -= 14;
  text(data.dnNumber, M, y, 11, bold);
  text(formatDate(data.createdAt), col2, y, 11);
  y -= 22;
  text("PENERIMA", M, y, 8, bold, MUTE);
  text("REFERENSI PERMINTAAN", col2, y, 8, bold, MUTE);
  y -= 14;
  text(
    `${data.recipientName}${data.recipientDivision ? " — " + data.recipientDivision : ""}`,
    M,
    y,
    11,
  );
  text(data.requestNumber, col2, y, 11);
  y -= 30;

  // Items table
  text("DAFTAR ASET", M, y, 8, bold, MUTE);
  y -= 16;
  page.drawLine({
    start: { x: M, y: y + 6 },
    end: { x: width - M, y: y + 6 },
    thickness: 0.5,
    color: LINE,
  });
  text("KODE ASET", M, y - 8, 8, bold, MUTE);
  text("NAMA", M + 130, y - 8, 8, bold, MUTE);
  text("KATEGORI", width - M - 120, y - 8, 8, bold, MUTE);
  y -= 24;
  page.drawLine({
    start: { x: M, y: y + 6 },
    end: { x: width - M, y: y + 6 },
    thickness: 0.5,
    color: LINE,
  });
  for (const it of data.items) {
    text(it.assetCode, M, y - 6, 10, bold);
    text(it.name.slice(0, 30), M + 130, y - 6, 10);
    text(it.category, width - M - 120, y - 6, 10);
    y -= 20;
  }
  y -= 30;

  // Signatures
  const sigY = Math.min(y, 180);
  text("Diserahkan oleh,", M, sigY, 10);
  text("Diterima oleh,", col2, sigY, 10);
  page.drawLine({
    start: { x: M, y: sigY - 60 },
    end: { x: M + 180, y: sigY - 60 },
    thickness: 0.5,
    color: LINE,
  });
  page.drawLine({
    start: { x: col2, y: sigY - 60 },
    end: { x: col2 + 180, y: sigY - 60 },
    thickness: 0.5,
    color: LINE,
  });
  text(data.creatorName, M, sigY - 74, 10, bold);
  text(data.recipientName, col2, sigY - 74, 10, bold);
  if (data.signedAt) {
    text(
      `Ditandatangani secara digital — ${formatDate(data.signedAt)}`,
      col2,
      sigY - 88,
      8,
      font,
      MUTE,
    );
  }

  return pdf.save();
}
