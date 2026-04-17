"use client";

import Image from "next/image";

export default function EvidenceModal({
  open,
  imageUrl,
  imageAlt,
  hasMultiple,
  onClose,
  onPrev,
  onNext,
}: {
  open: boolean;
  imageUrl: string | null;
  imageAlt: string;
  hasMultiple: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!open || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose} role="presentation">
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Xem ảnh bằng chứng"
      >
        <button
          className="absolute right-3 top-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-1 text-sm"
          onClick={onClose}
          type="button"
        >
          Đóng
        </button>
        {hasMultiple ? (
          <>
            <button
              className="absolute bottom-3 left-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2"
              onClick={onPrev}
              type="button"
            >
              Trước
            </button>
            <button
              className="absolute bottom-3 right-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2"
              onClick={onNext}
              type="button"
            >
              Sau
            </button>
          </>
        ) : null}
        <div className="mt-8 flex h-[68vh] min-h-[360px] w-full items-center justify-center overflow-hidden rounded-xl bg-[color:var(--surface-soft)]">
          <Image alt={imageAlt} className="h-full w-full object-contain" height={900} src={imageUrl} width={1200} />
        </div>
      </div>
    </div>
  );
}
