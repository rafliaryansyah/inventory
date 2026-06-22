import { QRCodeSVG } from "qrcode.react";

/** QR code asli (scannable) yang meng-encode sebuah URL/string. */
export function AssetQr({
  value,
  size = 40,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      marginSize={1}
      bgColor="#ffffff"
      fgColor="#1A1F2E"
      className={className}
    />
  );
}
