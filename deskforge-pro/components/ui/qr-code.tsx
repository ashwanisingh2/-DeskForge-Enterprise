'use client';
import {useEffect, useState} from 'react';
import QRCode from 'qrcode';

/** Renders a scannable QR code for the given value as a PNG data URL. */
export function QrCode({value, size = 128, label}: {value: string; size?: number; label?: string}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {width: size, margin: 1, errorCorrectionLevel: 'M'})
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => setSrc(null));
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} width={size} height={size} alt={label ? `QR code for ${label}` : 'QR code'} className="rounded-lg bg-white p-2" />
      ) : (
        <div className="animate-pulse rounded-lg bg-muted" style={{width: size, height: size}} />
      )}
      {label && <span className="font-mono text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
