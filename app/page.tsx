"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

const DEFAULT_RATE = 32500;

type Employee = {
  id: string;
  fullName: string;
  employeeCode: string;
  avatarPath: string | null;
  hourlyRate: number;
};

type Shift = {
  id: string;
  workDate: string;
  shiftIndex: 1 | 2;
  timeInMinutes: number;
  timeOutMinutes: number;
  breakInMinutes: number;
  breakOutMinutes: number;
  breakMinutes: number;
  workMinutes: number;
  salaryAmount: number;
  evidencePath: string | null;
};

type RangeSummary = {
  total: { workMinutes: number; salaryAmount: number };
  previousTotal: { workMinutes: number; salaryAmount: number };
  change: { workMinutesPct: number; salaryAmountPct: number };
  weekly: Array<{ key: string; workMinutes: number; salaryAmount: number }>;
  monthly: Array<{ key: string; workMinutes: number; salaryAmount: number }>;
};

type ReminderItem = {
  text: string;
  tone: "warn" | "ok";
};

function toMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function hoursLabel(minutes: number) {
  return (minutes / 60).toFixed(2);
}

function moneyLabel(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const next = new Date(date);
  next.setDate(date.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function weekKeyFromDateOnly(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  const dateUtc = Date.UTC(year, month - 1, day);
  const yearStartUtc = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((dateUtc - yearStartUtc) / (24 * 60 * 60 * 1000));
  const yearStartDay = new Date(yearStartUtc).getUTCDay();
  const week = Math.ceil((dayOfYear + yearStartDay + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function monthKeyFromDateOnly(dateText: string) {
  return dateText.slice(0, 7);
}

function getStoragePublicUrl(bucket: string, filePath: string | null | undefined) {
  if (!filePath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
}

function getAvatarUrl(avatarPath: string | null | undefined) {
  return getStoragePublicUrl("employee-avatars", avatarPath);
}

function getEvidenceUrl(evidencePath: string | null | undefined) {
  return getStoragePublicUrl("timesheet-evidence", evidencePath);
}

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

function TimePickerField({
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

function DatePickerField({
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

const inputClass =
  "mt-1 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20";

const primaryButtonClass =
  "rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryButtonClass =
  "rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[color:var(--surface-soft)]";

const PAGE_SIZE = 10;

export default function Home() {
  const today = toDateInput(new Date());
  const timesheetSectionRef = useRef<HTMLElement | null>(null);
  const summarySectionRef = useRef<HTMLElement | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeAuthMode, setActiveAuthMode] = useState<"login" | "register">("login");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");

  const [workDate, setWorkDate] = useState(today);
  const [shiftIndex, setShiftIndex] = useState<1 | 2>(1);
  const [timeIn, setTimeIn] = useState("08:00");
  const [timeOut, setTimeOut] = useState("17:00");
  const [breakIn, setBreakIn] = useState("12:00");
  const [breakOut, setBreakOut] = useState("13:00");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [entryMessage, setEntryMessage] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rangeFrom, setRangeFrom] = useState(today);
  const [rangeTo, setRangeTo] = useState(today);
  const [summary, setSummary] = useState<RangeSummary | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageAlt, setPreviewImageAlt] = useState<string>("");
  const [previewImageItems, setPreviewImageItems] = useState<Array<{ url: string; alt: string }>>([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [useNativePickers, setUseNativePickers] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" | "warn" } | null>(
    null,
  );

  const liveMetrics = useMemo(() => {
    const breakMinutes = Math.max(0, toMinutes(breakOut) - toMinutes(breakIn));
    const workMinutes = Math.max(0, toMinutes(timeOut) - toMinutes(timeIn) - breakMinutes);
    const salary = Math.round((workMinutes / 60) * (employee?.hourlyRate ?? DEFAULT_RATE));

    return { breakMinutes, workMinutes, salary };
  }, [breakIn, breakOut, employee?.hourlyRate, timeIn, timeOut]);

  const isRangeValid = Boolean(employee && rangeFrom && rangeTo && rangeFrom <= rangeTo);

  const todayShifts = useMemo(
    () => shifts.filter((shift) => shift.workDate.slice(0, 10) === today),
    [shifts, today],
  );

  const todayShiftStatus = useMemo(() => {
    const count = todayShifts.length;
    if (count === 0) return "Chưa chấm công";
    if (count === 1) return "Đã chấm 1/2 ca";
    if (count === 2) return "Đã chấm đủ 2/2 ca";
    return `Dữ liệu bất thường (${count} ca)`;
  }, [todayShifts]);

  const todayEvidenceStatus = useMemo(() => {
    if (todayShifts.length === 0) return "Chưa có ca để đối chiếu";
    const completed = todayShifts.filter((shift) => Boolean(shift.evidencePath)).length;
    if (completed === 0) return "Chưa tải ảnh";
    if (completed === todayShifts.length) return `Đã tải đủ (${completed}/${todayShifts.length})`;
    return `Đã tải ${completed}/${todayShifts.length}`;
  }, [todayShifts]);

  const evidencePreviewItems = useMemo(
    () =>
      shifts
        .filter((shift) => Boolean(shift.evidencePath && getEvidenceUrl(shift.evidencePath)))
        .map((shift) => ({
          url: getEvidenceUrl(shift.evidencePath) ?? "",
          alt: `Ảnh bằng chứng ${shift.workDate.slice(0, 10)} - Ca ${shift.shiftIndex}`,
        })),
    [shifts],
  );

  const frontendWeeklyMap = useMemo(() => {
    const map = new Map<string, { workMinutes: number; salaryAmount: number }>();
    for (const shift of shifts) {
      if (shift.workDate.slice(0, 10) < rangeFrom || shift.workDate.slice(0, 10) > rangeTo) continue;
      const key = weekKeyFromDateOnly(shift.workDate.slice(0, 10));
      const prev = map.get(key) ?? { workMinutes: 0, salaryAmount: 0 };
      map.set(key, {
        workMinutes: prev.workMinutes + shift.workMinutes,
        salaryAmount: prev.salaryAmount + shift.salaryAmount,
      });
    }
    return map;
  }, [rangeFrom, rangeTo, shifts]);

  const frontendMonthlyMap = useMemo(() => {
    const map = new Map<string, { workMinutes: number; salaryAmount: number }>();
    for (const shift of shifts) {
      if (shift.workDate.slice(0, 10) < rangeFrom || shift.workDate.slice(0, 10) > rangeTo) continue;
      const key = monthKeyFromDateOnly(shift.workDate.slice(0, 10));
      const prev = map.get(key) ?? { workMinutes: 0, salaryAmount: 0 };
      map.set(key, {
        workMinutes: prev.workMinutes + shift.workMinutes,
        salaryAmount: prev.salaryAmount + shift.salaryAmount,
      });
    }
    return map;
  }, [rangeFrom, rangeTo, shifts]);

  const weeklyConsistencyOk = useMemo(() => {
    if (!summary) return true;
    const backend = new Map(summary.weekly.map((item) => [item.key, item]));
    if (backend.size !== frontendWeeklyMap.size) return false;
    for (const [key, item] of backend.entries()) {
      const local = frontendWeeklyMap.get(key);
      if (!local) return false;
      if (local.workMinutes !== item.workMinutes || local.salaryAmount !== item.salaryAmount) return false;
    }
    return true;
  }, [frontendWeeklyMap, summary]);

  const monthlyConsistencyOk = useMemo(() => {
    if (!summary) return true;
    const backend = new Map(summary.monthly.map((item) => [item.key, item]));
    if (backend.size !== frontendMonthlyMap.size) return false;
    for (const [key, item] of backend.entries()) {
      const local = frontendMonthlyMap.get(key);
      if (!local) return false;
      if (local.workMinutes !== item.workMinutes || local.salaryAmount !== item.salaryAmount) return false;
    }
    return true;
  }, [frontendMonthlyMap, summary]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(shifts.length / PAGE_SIZE)), [shifts.length]);
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedShifts = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return shifts.slice(start, start + PAGE_SIZE);
  }, [safeCurrentPage, shifts]);

  const reminders = useMemo(() => {
    if (!employee) return [] as ReminderItem[];

    const list: ReminderItem[] = [];

    if (todayShifts.length === 0) {
      list.push({ text: "Bạn chưa chấm công hôm nay.", tone: "warn" });
    } else if (todayShifts.length < 2) {
      list.push({
        text: `Hôm nay mới có ${todayShifts.length}/2 ca. Bạn có thể nhập thêm ca còn lại nếu cần.`,
        tone: "warn",
      });
    }

    if (todayShifts.length > 0 && todayShifts.some((shift) => !shift.evidencePath)) {
      list.push({
        text: "Bạn đã chấm công hôm nay nhưng còn ca chưa tải ảnh bằng chứng.",
        tone: "warn",
      });
    }

    if (!employee.avatarPath) {
      list.push({ text: "Bạn chưa cập nhật ảnh đại diện tài khoản.", tone: "warn" });
    }

    if (rangeFrom > rangeTo) {
      list.push({
        text: "Khoảng ngày đang chọn chưa hợp lệ (Từ ngày lớn hơn Đến ngày).",
        tone: "warn",
      });
    }

    if (list.length === 0) {
      list.push({ text: "Mọi thứ đang ổn. Bạn có thể tiếp tục nhập giờ công.", tone: "ok" });
    }

    return list;
  }, [employee, rangeFrom, rangeTo, todayShifts]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) return;

      const data = (await res.json()) as { employee: Employee };
      setEmployee(data.employee);
    };

    void init();
  }, []);

  useEffect(() => {
    if (!employee) return;

    const loadShifts = async () => {
      setShiftsLoading(true);
      try {
        const res = await fetch("/api/shifts", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { shifts: Shift[] };
          setShifts(data.shifts);
        }
      } finally {
        setShiftsLoading(false);
      }
    };

    void loadShifts();
  }, [employee]);

  useEffect(() => {
    if (!isRangeValid) {
      return;
    }

    const loadSummary = async () => {
      setSummaryLoading(true);
      try {
        const params = new URLSearchParams({ from: rangeFrom, to: rangeTo });
        const res = await fetch(`/api/reports/summary?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setSummary(null);
          return;
        }
        const data = (await res.json()) as RangeSummary;
        setSummary(data);
      } finally {
        setSummaryLoading(false);
      }
    };

    void loadSummary();
  }, [isRangeValid, rangeFrom, rangeTo]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");

    const updatePickerMode = () => {
      setUseNativePickers(mediaQuery.matches);
    };

    updatePickerMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePickerMode);
      return () => mediaQuery.removeEventListener("change", updatePickerMode);
    }

    mediaQuery.addListener(updatePickerMode);
    return () => mediaQuery.removeListener(updatePickerMode);
  }, []);

  useEffect(() => {
    if (!previewImageUrl) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewImageUrl(null);
        setPreviewImageAlt("");
      } else if (event.key === "ArrowLeft") {
        if (previewImageItems.length <= 1) return;
        const nextIndex = (previewImageIndex - 1 + previewImageItems.length) % previewImageItems.length;
        setPreviewImageIndex(nextIndex);
        setPreviewImageUrl(previewImageItems[nextIndex]?.url ?? null);
        setPreviewImageAlt(previewImageItems[nextIndex]?.alt ?? "");
      } else if (event.key === "ArrowRight") {
        if (previewImageItems.length <= 1) return;
        const nextIndex = (previewImageIndex + 1) % previewImageItems.length;
        setPreviewImageIndex(nextIndex);
        setPreviewImageUrl(previewImageItems[nextIndex]?.url ?? null);
        setPreviewImageAlt(previewImageItems[nextIndex]?.alt ?? "");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewImageUrl, previewImageIndex, previewImageItems]);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");

    try {
      const body =
        activeAuthMode === "register"
          ? { fullName, employeeCode, password }
          : { employeeCode, password };

      const endpoint =
        activeAuthMode === "register" ? "/api/auth/register" : "/api/auth/login";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthMessage(data.message ?? "Xác thực thất bại");
        setToast({ message: data.message ?? "Xác thực thất bại", tone: "error" });
        return;
      }

      setEmployee(data.employee as Employee);
      setAuthMessage(
        activeAuthMode === "register"
          ? "Tạo tài khoản và đăng nhập thành công"
          : "Đăng nhập thành công",
      );
      setToast({
        message:
          activeAuthMode === "register"
            ? "Tạo tài khoản và đăng nhập thành công"
            : "Đăng nhập thành công",
        tone: "success",
      });
    } catch {
      setAuthMessage("Không thể kết nối tới máy chủ");
      setToast({ message: "Không thể kết nối tới máy chủ", tone: "error" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmployee(null);
    setShifts([]);
    setSummary(null);
    setAvatarMessage("");
    setToast({ message: "Đã đăng xuất", tone: "warn" });
  };

  const handleAvatarUpload = async (file: File) => {
    if (!employee) return;

    setAvatarUploading(true);
    setAvatarMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setAvatarMessage(data.message ?? "Cập nhật ảnh đại diện thất bại");
        setToast({ message: data.message ?? "Cập nhật ảnh đại diện thất bại", tone: "error" });
        return;
      }

      setEmployee((prev) =>
        prev
          ? {
              ...prev,
              avatarPath: String(data.avatarPath),
            }
          : prev,
      );
      setAvatarMessage("Cập nhật ảnh đại diện thành công");
      setToast({ message: "Cập nhật ảnh đại diện thành công", tone: "success" });
    } catch {
      setAvatarMessage("Không thể kết nối tới máy chủ");
      setToast({ message: "Không thể kết nối tới máy chủ", tone: "error" });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const scrollToTimesheet = () => {
    timesheetSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToSummary = () => {
    summarySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSaveShift = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employee) return;

    setSaveLoading(true);
    setEntryMessage("");

    try {
      let evidencePath: string | undefined;

      if (evidenceFile) {
        const form = new FormData();
        form.append("file", evidenceFile);
        const uploadRes = await fetch("/api/evidence/upload", {
          method: "POST",
          body: form,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setEntryMessage(uploadData.message ?? "Tải ảnh thất bại");
          setToast({ message: uploadData.message ?? "Tải ảnh thất bại", tone: "error" });
          return;
        }
        evidencePath = String(uploadData.path);
      }

      const saveRes = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workDate,
          shiftIndex,
          timeIn,
          timeOut,
          breakIn,
          breakOut,
          evidencePath,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        setEntryMessage(saveData.message ?? "Lưu giờ công thất bại");
        setToast({ message: saveData.message ?? "Lưu giờ công thất bại", tone: "error" });
        return;
      }

      const listRes = await fetch("/api/shifts", { cache: "no-store" });
      const listData = (await listRes.json()) as { shifts: Shift[] };
      setShifts(listData.shifts);

      setEvidenceFile(null);
      setEntryMessage("Lưu giờ công thành công");
      setToast({ message: "Lưu giờ công thành công", tone: "success" });
    } catch {
      setEntryMessage("Không thể kết nối tới máy chủ");
      setToast({ message: "Không thể kết nối tới máy chủ", tone: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  const openEvidencePreview = (url: string, alt: string) => {
    const index = evidencePreviewItems.findIndex((item) => item.url === url);
    setPreviewImageItems(evidencePreviewItems);
    setPreviewImageIndex(index >= 0 ? index : 0);
    setPreviewImageUrl(url);
    setPreviewImageAlt(alt);
  };

  const closeEvidencePreview = () => {
    setPreviewImageUrl(null);
    setPreviewImageAlt("");
    setPreviewImageItems([]);
    setPreviewImageIndex(0);
  };

  const goPrevPreviewImage = () => {
    if (previewImageItems.length <= 1) return;
    const nextIndex = (previewImageIndex - 1 + previewImageItems.length) % previewImageItems.length;
    setPreviewImageIndex(nextIndex);
    setPreviewImageUrl(previewImageItems[nextIndex]?.url ?? null);
    setPreviewImageAlt(previewImageItems[nextIndex]?.alt ?? "");
  };

  const goNextPreviewImage = () => {
    if (previewImageItems.length <= 1) return;
    const nextIndex = (previewImageIndex + 1) % previewImageItems.length;
    setPreviewImageIndex(nextIndex);
    setPreviewImageUrl(previewImageItems[nextIndex]?.url ?? null);
    setPreviewImageAlt(previewImageItems[nextIndex]?.alt ?? "");
  };

  const applyQuickRange = (preset: "today" | "week" | "month") => {
    const now = new Date();
    if (preset === "today") {
      const value = toDateInput(now);
      setRangeFrom(value);
      setRangeTo(value);
      return;
    }

    if (preset === "week") {
      setRangeFrom(toDateInput(startOfWeek(now)));
      setRangeTo(toDateInput(endOfWeek(now)));
      return;
    }

    setRangeFrom(toDateInput(startOfMonth(now)));
    setRangeTo(toDateInput(endOfMonth(now)));
  };

  const handleDeleteShift = async (shiftId: string) => {
    setDeletingShiftId(shiftId);
    try {
      const res = await fetch(`/api/shifts?id=${shiftId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.message ?? "Xóa ngày công thất bại", tone: "error" });
        return;
      }

      setShifts((prev) => prev.filter((shift) => shift.id !== shiftId));
      setToast({ message: "Đã xóa ngày công", tone: "success" });
    } catch {
      setToast({ message: "Không thể kết nối tới máy chủ", tone: "error" });
    } finally {
      setDeletingShiftId(null);
    }
  };

  const exportShiftsToCsv = () => {
    if (shifts.length === 0) {
      setToast({ message: "Không có dữ liệu để xuất CSV", tone: "warn" });
      return;
    }

    const escapeCsv = (value: string | number) => {
      const text = String(value ?? "");
      if (text.includes(",") || text.includes("\n") || text.includes('"')) {
        return `"${text.replaceAll('"', '""')}"`;
      }
      return text;
    };

    const header = [
      "Ngày",
      "Ca",
      "Giờ vào",
      "Giờ ra",
      "Bắt đầu nghỉ",
      "Kết thúc nghỉ",
      "Phút nghỉ",
      "Giờ công",
      "Lương (VND)",
      "Ảnh bằng chứng",
    ];

    const rows = shifts.map((shift) => [
      shift.workDate.slice(0, 10),
      `Ca ${shift.shiftIndex}`,
      toHHMM(shift.timeInMinutes),
      toHHMM(shift.timeOutMinutes),
      toHHMM(shift.breakInMinutes),
      toHHMM(shift.breakOutMinutes),
      shift.breakMinutes,
      Number(hoursLabel(shift.workMinutes)),
      shift.salaryAmount,
      getEvidenceUrl(shift.evidencePath) ?? "",
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => escapeCsv(value)).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `joworking-time-${toDateInput(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({ message: "Xuất CSV thành công", tone: "success" });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d6e8ff_0%,transparent_43%),radial-gradient(circle_at_bottom_right,#d9f2ff_0%,transparent_36%),linear-gradient(180deg,#f8fbff_0%,var(--background)_40%)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,#14365f_0%,transparent_42%),radial-gradient(circle_at_bottom_right,#12304f_0%,transparent_35%),linear-gradient(180deg,#0f1d32_0%,var(--background)_40%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="card rounded-2xl bg-[linear-gradient(135deg,rgba(15,111,232,0.07),transparent_42%)] px-5 py-5 sm:px-7 dark:bg-[linear-gradient(135deg,rgba(85,191,255,0.12),transparent_42%)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                JO WORKING TIME
              </p>
              <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                Theo dõi giờ công part-time và tính lương
              </h1>
              {employee ? (
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  Xin chào {employee.fullName} - Mã NV {employee.employeeCode}
                </p>
              ) : null}
            </div>

            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <div className="soft-card inline-flex rounded-xl p-1">
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                    theme === "light"
                      ? "bg-[color:var(--accent)] text-white"
                      : "text-[color:var(--muted)]"
                  }`}
                  onClick={() => setTheme("light")}
                  type="button"
                >
                  Sáng
                </button>
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                    theme === "dark"
                      ? "bg-[color:var(--accent)] text-white"
                      : "text-[color:var(--muted)]"
                  }`}
                  onClick={() => setTheme("dark")}
                  type="button"
                >
                  Tối
                </button>
              </div>

              {employee ? (
                <span className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--foreground)]">
                  Đang đăng nhập
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          {employee ? (
            <div className="card rounded-2xl p-5 sm:p-6">
              <h2 className="font-mono text-xl font-semibold">Thẻ nhân viên</h2>

              <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-3 sm:flex-row sm:items-center sm:gap-4">
                {getAvatarUrl(employee.avatarPath) ? (
                  <Image
                    alt="Ảnh đại diện"
                    className="h-16 w-16 rounded-full border border-[color:var(--line)] object-cover"
                    src={getAvatarUrl(employee.avatarPath) ?? ""}
                    width={64}
                    height={64}
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] text-lg font-semibold">
                    {employee.fullName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{employee.fullName}</p>
                  <p className="text-xs text-[color:var(--muted)]">Mã NV {employee.employeeCode}</p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    Đơn giá: {moneyLabel(employee.hourlyRate)}/giờ
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
                  <button
                    className={`${primaryButtonClass} w-full sm:w-auto`}
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                    type="button"
                  >
                    {avatarUploading ? "Đang tải ảnh..." : "Cập nhật ảnh đại diện"}
                  </button>
                  <input
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleAvatarUpload(file);
                      }
                    }}
                    ref={avatarInputRef}
                    type="file"
                  />
                  {avatarMessage ? <p className="text-xs text-[color:var(--muted)]">{avatarMessage}</p> : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="soft-card rounded-xl p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
                    Trạng thái hôm nay
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {todayShiftStatus}
                  </p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
                    Ảnh bằng chứng hôm nay
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {todayEvidenceStatus}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold">Hành động nhanh</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className={`${primaryButtonClass} w-full sm:w-auto`}
                    onClick={scrollToTimesheet}
                    type="button"
                  >
                    Chấm công hôm nay
                  </button>
                  <button
                    className={`${secondaryButtonClass} w-full sm:w-auto`}
                    onClick={scrollToSummary}
                    type="button"
                  >
                    Xem tổng hợp
                  </button>
                  <button
                    className={`${secondaryButtonClass} w-full sm:w-auto`}
                    onClick={handleLogout}
                    type="button"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold">Nhắc việc / cảnh báo</p>
                <ul className="mt-2 space-y-2 text-sm text-[color:var(--muted)]">
                  {reminders.map((item) => (
                    <li
                      className={`rounded-xl px-3 py-2 ${
                        item.tone === "ok"
                          ? "border border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[color:var(--foreground)]"
                          : "soft-card"
                      }`}
                      key={item.text}
                    >
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <form className="card rounded-2xl p-5 sm:p-6" onSubmit={handleAuth}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-mono text-xl font-semibold">Xác thực nhân viên</h2>
                <div className="soft-card inline-flex rounded-lg p-1">
                  <button
                    className={`rounded-md px-3 py-1 text-xs ${
                      activeAuthMode === "login"
                        ? "bg-[color:var(--accent)] text-white"
                        : "text-[color:var(--muted)]"
                    }`}
                    onClick={() => setActiveAuthMode("login")}
                    type="button"
                  >
                    Đăng nhập
                  </button>
                  <button
                    className={`rounded-md px-3 py-1 text-xs ${
                      activeAuthMode === "register"
                        ? "bg-[color:var(--accent)] text-white"
                        : "text-[color:var(--muted)]"
                    }`}
                    onClick={() => setActiveAuthMode("register")}
                    type="button"
                  >
                    Đăng ký
                  </button>
                </div>
              </div>

              {activeAuthMode === "register" ? (
                <label className="mt-4 block text-sm">
                  Họ tên
                  <input
                    className={inputClass}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                  />
                </label>
              ) : null}

              <label className="mt-4 block text-sm">
                Mã nhân viên (3-4 số)
                <input
                  className={inputClass}
                  onChange={(event) => setEmployeeCode(event.target.value)}
                  value={employeeCode}
                />
              </label>

              <label className="mt-3 block text-sm">
                Mật khẩu
                <input
                  className={inputClass}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </label>

              {authMessage ? (
                <p className="mt-3 text-sm text-[color:var(--muted)]">{authMessage}</p>
              ) : null}

              <button
                className={`mt-4 w-full sm:w-auto ${primaryButtonClass}`}
                disabled={authLoading}
                type="submit"
              >
                {authLoading
                  ? "Đang xử lý..."
                  : activeAuthMode === "login"
                    ? "Đăng nhập"
                    : "Đăng ký"}
              </button>
            </form>
          )}

          <div className="card rounded-2xl p-5 sm:p-6">
            <h2 className="font-mono text-xl font-semibold">Tóm tắt ngày</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="soft-card rounded-xl p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  Giờ làm
                </p>
                <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">{hoursLabel(liveMetrics.workMinutes)} h</p>
              </div>
              <div className="soft-card rounded-xl p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  Lương ngày
                </p>
                <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">{moneyLabel(liveMetrics.salary)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              Đơn giá hiện tại: {moneyLabel(employee?.hourlyRate ?? DEFAULT_RATE)}/giờ
            </p>
          </div>
        </section>

        <section className="card rounded-2xl p-5 sm:p-6" ref={timesheetSectionRef}>
          <h2 className="font-mono text-xl font-semibold">Nhập giờ công mỗi ngày</h2>
          <form className="mt-4 grid gap-4" onSubmit={handleSaveShift}>
            <div className="grid gap-3 sm:grid-cols-2">
              {useNativePickers ? (
                <label className="text-sm">
                  Ngày
                  <input
                    className={inputClass}
                    onChange={(event) => setWorkDate(event.target.value)}
                    type="date"
                    value={workDate}
                  />
                </label>
              ) : (
                <DatePickerField label="Ngày" onChange={setWorkDate} value={workDate} />
              )}
              <label className="text-sm">
                Ca làm
                <select
                  className={inputClass}
                  onChange={(event) => setShiftIndex(Number(event.target.value) as 1 | 2)}
                  value={shiftIndex}
                >
                  <option value={1}>Ca 1</option>
                  <option value={2}>Ca 2</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="soft-card rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">Khung giờ làm</p>
                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  {useNativePickers ? (
                    <label className="text-sm">
                      Giờ vào
                      <input
                        className={inputClass}
                        onChange={(event) => setTimeIn(event.target.value)}
                        type="time"
                        value={timeIn}
                      />
                    </label>
                  ) : (
                    <TimePickerField label="Giờ vào" onChange={setTimeIn} value={timeIn} />
                  )}
                  <span className="pb-2 text-[color:var(--muted)]">→</span>
                  {useNativePickers ? (
                    <label className="text-sm">
                      Giờ ra
                      <input
                        className={inputClass}
                        onChange={(event) => setTimeOut(event.target.value)}
                        type="time"
                        value={timeOut}
                      />
                    </label>
                  ) : (
                    <TimePickerField label="Giờ ra" onChange={setTimeOut} value={timeOut} />
                  )}
                </div>
              </div>

              <div className="soft-card rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">Khoảng nghỉ</p>
                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  {useNativePickers ? (
                    <label className="text-sm">
                      Bắt đầu
                      <input
                        className={inputClass}
                        onChange={(event) => setBreakIn(event.target.value)}
                        type="time"
                        value={breakIn}
                      />
                    </label>
                  ) : (
                    <TimePickerField label="Bắt đầu" onChange={setBreakIn} value={breakIn} />
                  )}
                  <span className="pb-2 text-[color:var(--muted)]">→</span>
                  {useNativePickers ? (
                    <label className="text-sm">
                      Kết thúc
                      <input
                        className={inputClass}
                        onChange={(event) => setBreakOut(event.target.value)}
                        type="time"
                        value={breakOut}
                      />
                    </label>
                  ) : (
                    <TimePickerField label="Kết thúc" onChange={setBreakOut} value={breakOut} />
                  )}
                </div>
              </div>
            </div>

            <label className="text-sm">
              Ảnh bằng chứng
              <input
                accept="image/*"
                className="mt-1 w-full rounded-xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none"
                onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>

            <div>
              {entryMessage ? (
                <p className="text-sm text-[color:var(--muted)]">{entryMessage}</p>
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  Nghỉ: {liveMetrics.breakMinutes} phút | Giờ công: {hoursLabel(liveMetrics.workMinutes)} h
                </p>
              )}
              <button
                className="mt-3 rounded-xl bg-[color:var(--accent-2)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50 disabled:hover:translate-y-0"
                disabled={!employee || saveLoading}
                type="submit"
              >
                {saveLoading ? "Đang lưu..." : "Lưu giờ công"}
              </button>
              {!employee ? (
                <p className="mt-2 text-xs text-[color:var(--warn)]">Cần đăng nhập trước khi lưu.</p>
              ) : null}
            </div>
          </form>
        </section>

        <section className="grid gap-5 lg:grid-cols-2" ref={summarySectionRef}>
          <div className="card rounded-2xl p-5 sm:p-6">
            <h2 className="font-mono text-xl font-semibold">Tổng hợp theo khoảng ngày</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={`${secondaryButtonClass} flex-1 min-w-[92px] sm:flex-none`}
                onClick={() => applyQuickRange("today")}
                type="button"
              >
                Hôm nay
              </button>
              <button
                className={`${secondaryButtonClass} flex-1 min-w-[92px] sm:flex-none`}
                onClick={() => applyQuickRange("week")}
                type="button"
              >
                Tuần này
              </button>
              <button
                className={`${secondaryButtonClass} flex-1 min-w-[92px] sm:flex-none`}
                onClick={() => applyQuickRange("month")}
                type="button"
              >
                Tháng này
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {useNativePickers ? (
                <label className="text-sm">
                  Từ ngày
                  <input
                    className={inputClass}
                    onChange={(event) => setRangeFrom(event.target.value)}
                    type="date"
                    value={rangeFrom}
                  />
                </label>
              ) : (
                <DatePickerField label="Từ ngày" onChange={setRangeFrom} value={rangeFrom} />
              )}

              {useNativePickers ? (
                <label className="text-sm">
                  Đến ngày
                  <input
                    className={inputClass}
                    onChange={(event) => setRangeTo(event.target.value)}
                    type="date"
                    value={rangeTo}
                  />
                </label>
              ) : (
                <DatePickerField label="Đến ngày" onChange={setRangeTo} value={rangeTo} />
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="soft-card rounded-xl p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  Tổng giờ công
                </p>
                <p className="mt-1 font-mono text-xl font-semibold">
                  {summaryLoading ? "..." : summary && isRangeValid ? `${hoursLabel(summary.total.workMinutes)} h` : "0.00 h"}
                </p>
              </div>
              <div className="soft-card rounded-xl p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  Tổng lương
                </p>
                <p className="mt-1 font-mono text-xl font-semibold">
                  {summaryLoading ? "..." : summary && isRangeValid ? moneyLabel(summary.total.salaryAmount) : moneyLabel(0)}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="soft-card rounded-xl p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">So với kỳ trước (giờ)</p>
                <p className="mt-1 font-mono text-xl font-semibold">
                  {summaryLoading || !summary ? "..." : `${summary.change.workMinutesPct >= 0 ? "+" : ""}${summary.change.workMinutesPct}%`}
                </p>
              </div>
              <div className="soft-card rounded-xl p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">So với kỳ trước (lương)</p>
                <p className="mt-1 font-mono text-xl font-semibold">
                  {summaryLoading || !summary ? "..." : `${summary.change.salaryAmountPct >= 0 ? "+" : ""}${summary.change.salaryAmountPct}%`}
                </p>
              </div>
            </div>
          </div>

          <div className="card rounded-2xl p-5 sm:p-6">
            <h2 className="font-mono text-xl font-semibold">Bảng điều khiển</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              So sánh tổng giờ công và lương theo tuần/tháng.
            </p>
            {summary && !(weeklyConsistencyOk && monthlyConsistencyOk) ? (
              <p className="mt-2 text-xs text-[color:var(--warn)]">
                Dữ liệu tuần/tháng chưa đồng bộ hoàn toàn giữa frontend và backend.
              </p>
            ) : null}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Theo tuần</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {summaryLoading ? (
                    <li className="space-y-2">
                      <div className="h-12 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
                      <div className="h-12 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
                    </li>
                  ) : !summary || !isRangeValid || summary.weekly.length === 0 ? (
                    <li className="text-[color:var(--muted)]">Chưa có dữ liệu.</li>
                  ) : (
                    summary.weekly.map((item) => (
                      <li className="soft-card rounded-xl p-2" key={item.key}>
                        <p className="font-medium">{item.key}</p>
                        <div className="mt-1 h-2 rounded-full bg-[color:var(--line)]">
                          <div
                            className="h-2 rounded-full bg-[color:var(--accent)]"
                            style={{
                              width: `${Math.max(
                                8,
                                Math.min(
                                  100,
                                  (item.workMinutes /
                                    Math.max(...summary.weekly.map((value) => value.workMinutes), 1)) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[color:var(--muted)]">
                          {hoursLabel(item.workMinutes)} h | {moneyLabel(item.salaryAmount)}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Theo tháng</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {summaryLoading ? (
                    <li className="space-y-2">
                      <div className="h-12 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
                      <div className="h-12 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
                    </li>
                  ) : !summary || !isRangeValid || summary.monthly.length === 0 ? (
                    <li className="text-[color:var(--muted)]">Chưa có dữ liệu.</li>
                  ) : (
                    summary.monthly.map((item) => (
                      <li className="soft-card rounded-xl p-2" key={item.key}>
                        <p className="font-medium">{item.key}</p>
                        <div className="mt-1 h-2 rounded-full bg-[color:var(--line)]">
                          <div
                            className="h-2 rounded-full bg-[color:var(--accent-2)]"
                            style={{
                              width: `${Math.max(
                                8,
                                Math.min(
                                  100,
                                  (item.workMinutes /
                                    Math.max(...summary.monthly.map((value) => value.workMinutes), 1)) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[color:var(--muted)]">
                          {hoursLabel(item.workMinutes)} h | {moneyLabel(item.salaryAmount)}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-xl font-semibold">Danh sách chấm công</h2>
            <button className={secondaryButtonClass} onClick={exportShiftsToCsv} type="button">
              Xuất CSV
            </button>
          </div>
          {shiftsLoading ? (
            <div className="mt-3 space-y-2">
              <div className="h-10 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
              <div className="h-10 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
              <div className="h-10 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
            </div>
          ) : shifts.length === 0 ? (
            <p className="mt-3 text-sm text-[color:var(--muted)]">Chưa có ngày công nào được lưu.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-[color:var(--line)]">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[color:var(--muted)]">
                    <th className="whitespace-nowrap px-2 py-2">Ngày</th>
                    <th className="whitespace-nowrap px-2 py-2">Ca</th>
                    <th className="whitespace-nowrap px-2 py-2">Ca làm</th>
                    <th className="whitespace-nowrap px-2 py-2">Nghỉ giữa ca</th>
                    <th className="whitespace-nowrap px-2 py-2">Giờ công</th>
                    <th className="whitespace-nowrap px-2 py-2">Lương</th>
                    <th className="whitespace-nowrap px-2 py-2">Ảnh bằng chứng</th>
                    <th className="whitespace-nowrap px-2 py-2">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedShifts.map((shift) => (
                    <tr className="border-b border-[color:var(--line)] odd:bg-[color:var(--surface)] even:bg-[color:var(--surface-soft)]" key={shift.id}>
                      <td className="px-2 py-2">{shift.workDate.slice(0, 10)}</td>
                      <td className="px-2 py-2">Ca {shift.shiftIndex}</td>
                      <td className="px-2 py-2">
                        {toHHMM(shift.timeInMinutes)} - {toHHMM(shift.timeOutMinutes)}
                      </td>
                      <td className="px-2 py-2">
                        {toHHMM(shift.breakInMinutes)} - {toHHMM(shift.breakOutMinutes)}
                      </td>
                      <td className="px-2 py-2">{hoursLabel(shift.workMinutes)} h</td>
                      <td className="px-2 py-2">{moneyLabel(shift.salaryAmount)}</td>
                      <td className="px-2 py-2">
                        {shift.evidencePath && getEvidenceUrl(shift.evidencePath) ? (
                          <button
                            className="inline-block cursor-zoom-in"
                            onClick={() =>
                              openEvidencePreview(
                                getEvidenceUrl(shift.evidencePath) ?? "",
                                `Ảnh bằng chứng ${shift.workDate.slice(0, 10)} - Ca ${shift.shiftIndex}`,
                              )
                            }
                            type="button"
                          >
                            <Image
                              alt={`Ảnh bằng chứng ${shift.workDate.slice(0, 10)}`}
                              className="h-14 w-20 rounded-lg border border-[color:var(--line)] object-cover"
                              height={56}
                              src={getEvidenceUrl(shift.evidencePath) ?? ""}
                              width={80}
                            />
                          </button>
                        ) : (
                          "Không có"
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                          disabled={deletingShiftId === shift.id}
                          onClick={() => handleDeleteShift(shift.id)}
                          type="button"
                        >
                          {deletingShiftId === shift.id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!shiftsLoading && shifts.length > PAGE_SIZE ? (
            <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[color:var(--muted)]">
                Trang {safeCurrentPage}/{totalPages} - Hiển thị {paginatedShifts.length} trên tổng {shifts.length} ngày công
              </p>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <button
                  className={`${secondaryButtonClass} flex-1 sm:flex-none`}
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  type="button"
                >
                  Trước
                </button>
                <button
                  className={`${secondaryButtonClass} flex-1 sm:flex-none`}
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  type="button"
                >
                  Sau
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {previewImageUrl ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={closeEvidencePreview}
            role="presentation"
          >
            <div
              className="relative w-full max-w-4xl rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Xem ảnh bằng chứng"
            >
              <button
                className="absolute right-3 top-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-1 text-sm"
                onClick={closeEvidencePreview}
                type="button"
              >
                Đóng
              </button>
              {previewImageItems.length > 1 ? (
                <>
                  <button
                    className="absolute bottom-3 left-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2"
                    onClick={goPrevPreviewImage}
                    type="button"
                  >
                    Trước
                  </button>
                  <button
                    className="absolute bottom-3 right-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2"
                    onClick={goNextPreviewImage}
                    type="button"
                  >
                    Sau
                  </button>
                </>
              ) : null}
              <div className="mt-8 overflow-hidden rounded-xl bg-[color:var(--surface-soft)]">
                <Image
                  alt={previewImageAlt}
                  className="h-auto max-h-[78vh] w-full object-contain"
                  height={900}
                  src={previewImageUrl}
                  width={1200}
                />
              </div>
            </div>
          </div>
        ) : null}

        {toast ? (
          <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-5 sm:max-w-sm">
            <div
              className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
                toast.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : toast.tone === "warn"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {toast.message}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
