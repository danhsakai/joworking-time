"use client";

import { useEffect, useRef, useState } from "react";

function parseHHMM(value: string) {
  const [h, m] = value.split(":").map(Number);
  return {
    hour: Number.isFinite(h) ? h : 0,
    minute: Number.isFinite(m) ? m : 0,
  };
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function monthLabel(date: Date) {
  return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
}

function calendarDays(viewMonth: Date) {
  const firstDayOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, idx) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + idx);
    return day;
  });
}

export function TimePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { hour, minute } = parseHHMM(value);

  useEffect(() => {
    if (!open) return;

    const onOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onOutsideClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onOutsideClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="text-sm">{label}</label>
      <button
        className="mt-1 flex w-full items-center justify-between rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm shadow-sm transition hover:bg-[color:var(--surface-soft)]"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="font-medium">{value}</span>
        <span className="text-[color:var(--muted)]">🕒</span>
      </button>

      {open ? (
        <div className="absolute left-0 z-30 mt-2 w-[272px] max-w-[calc(100vw-3rem)] rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Chọn giờ
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[color:var(--muted)]">Giờ</p>
              <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-1">
                {Array.from({ length: 24 }, (_, idx) => idx).map((item) => {
                  const selected = item === hour;
                  return (
                    <button
                      className={`mb-1 w-full rounded-lg px-2 py-1.5 text-left text-sm last:mb-0 ${
                        selected
                          ? "bg-[color:var(--accent)] text-white"
                          : "hover:bg-[color:var(--surface)]"
                      }`}
                      key={`hour-${item}`}
                      onClick={() => onChange(`${pad2(item)}:${pad2(minute)}`)}
                      type="button"
                    >
                      {pad2(item)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs text-[color:var(--muted)]">Phút</p>
              <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-1">
                {Array.from({ length: 60 }, (_, idx) => idx).map((item) => {
                  const selected = item === minute;
                  return (
                    <button
                      className={`mb-1 w-full rounded-lg px-2 py-1.5 text-left text-sm last:mb-0 ${
                        selected
                          ? "bg-[color:var(--accent)] text-white"
                          : "hover:bg-[color:var(--surface)]"
                      }`}
                      key={`minute-${item}`}
                      onClick={() => onChange(`${pad2(hour)}:${pad2(item)}`)}
                      type="button"
                    >
                      {pad2(item)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <button
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs"
              onClick={() => setOpen(false)}
              type="button"
            >
              Xong
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = parseDateInput(value) ?? new Date();
  const [viewMonth, setViewMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  useEffect(() => {
    if (!open) return;

    const onOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onOutsideClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onOutsideClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const days = calendarDays(viewMonth);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="text-sm">{label}</label>
      <button
        className="mt-1 flex w-full items-center justify-between rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm shadow-sm transition hover:bg-[color:var(--surface-soft)]"
        onClick={() => {
          const parsed = parseDateInput(value);
          if (parsed) {
            setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
          }
          setOpen((prev) => !prev);
        }}
        type="button"
      >
        <span className="font-medium">{value}</span>
        <span className="text-[color:var(--muted)]">📅</span>
      </button>

      {open ? (
        <div className="absolute left-0 z-30 mt-2 w-[300px] max-w-[calc(100vw-3rem)] rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-2 py-1 text-xs"
              onClick={() =>
                setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
              type="button"
            >
              ←
            </button>
            <p className="text-sm font-semibold">{monthLabel(viewMonth)}</p>
            <button
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-2 py-1 text-xs"
              onClick={() =>
                setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              type="button"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-[color:var(--muted)]">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span>CN</span>
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth();
              const isSelected = toDateInput(day) === value;
              return (
                <button
                  className={`rounded-lg px-1 py-1.5 text-sm ${
                    isSelected
                      ? "bg-[color:var(--accent)] text-white"
                      : inMonth
                        ? "hover:bg-[color:var(--surface-soft)]"
                        : "text-[color:var(--muted)]/60 hover:bg-[color:var(--surface-soft)]"
                  }`}
                  key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                  onClick={() => {
                    onChange(toDateInput(day));
                    setOpen(false);
                  }}
                  type="button"
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex justify-between">
            <button
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs"
              onClick={() => {
                onChange(toDateInput(new Date()));
                setOpen(false);
              }}
              type="button"
            >
              Hôm nay
            </button>
            <button
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs"
              onClick={() => setOpen(false)}
              type="button"
            >
              Xong
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
