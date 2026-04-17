"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import EmployeeCard from "@/app/components/employee-card";
import { AppBackground, AppHeader, FullPageLoader } from "@/app/components/page-shell";
import SummaryPanel from "@/app/components/summary-panel";
import TimesheetForm from "@/app/components/timesheet-form";

const LazyEvidenceModal = dynamic(() => import("@/app/components/evidence-modal"), {
  ssr: false,
});

const LazyShiftsTable = dynamic(() => import("@/app/components/shifts-table"), {
  ssr: false,
  loading: () => (
    <section className="card rounded-2xl p-5 sm:p-6">
      <div className="h-6 w-40 animate-pulse rounded-lg bg-[color:var(--surface-soft)]" />
      <div className="mt-4 space-y-2">
        <div className="h-10 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
        <div className="h-10 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
        <div className="h-10 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
      </div>
    </section>
  ),
});

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

function hoursLabel(minutes: number) {
  return (minutes / 60).toFixed(2);
}

function moneyLabel(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

function toHHMM(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
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


const inputClass =
  "mt-1 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20";

const primaryButtonClass =
  "rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryButtonClass =
  "rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[color:var(--surface-soft)]";

const LazyDashboardComparison = dynamic(
  () => import("@/app/components/dashboard-comparison"),
  {
    ssr: false,
    loading: () => (
      <div className="card rounded-2xl p-5 sm:p-6">
        <div className="h-6 w-44 animate-pulse rounded-lg bg-[color:var(--surface-soft)]" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded-lg bg-[color:var(--surface-soft)]" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
            <div className="h-12 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
          </div>
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
            <div className="h-12 animate-pulse rounded-xl bg-[color:var(--surface-soft)]" />
          </div>
        </div>
      </div>
    ),
  },
);

export default function Home() {
  const router = useRouter();
  const today = toDateInput(new Date());
  const timesheetSectionRef = useRef<HTMLDivElement | null>(null);
  const summarySectionRef = useRef<HTMLElement | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");

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
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageAlt, setPreviewImageAlt] = useState<string>("");
  const [previewImageItems, setPreviewImageItems] = useState<Array<{ url: string; alt: string }>>([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [useNativePickers, setUseNativePickers] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [initialShiftsLoaded, setInitialShiftsLoaded] = useState(false);
  const [initialSummaryLoaded, setInitialSummaryLoaded] = useState(false);
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
      if (res.ok) {
        const data = (await res.json()) as { employee: Employee };
        setEmployee(data.employee);
      }
      setAuthResolved(true);
    };

    void init();
  }, []);

  useEffect(() => {
    if (!authResolved) return;
    if (!employee) {
      router.replace("/auth");
    }
  }, [authResolved, employee, router]);

  useEffect(() => {
    if (!employee) return;

    let cancelled = false;

    const loadShifts = async () => {
      setShiftsLoading(true);
      try {
        const res = await fetch("/api/shifts", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { shifts: Shift[] };
          if (!cancelled) {
            setShifts(data.shifts);
          }
        }
      } finally {
        if (!cancelled) {
          setShiftsLoading(false);
          setInitialShiftsLoaded(true);
        }
      }
    };

    void loadShifts();

    return () => {
      cancelled = true;
    };
  }, [employee]);

  useEffect(() => {
    if (!isRangeValid) {
      return;
    }

    let cancelled = false;

    const loadSummary = async () => {
      setSummaryLoading(true);
      try {
        const params = new URLSearchParams({ from: rangeFrom, to: rangeTo });
        const res = await fetch(`/api/reports/summary?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) {
            setSummary(null);
          }
          return;
        }
        const data = (await res.json()) as RangeSummary;
        if (!cancelled) {
          setSummary(data);
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
          setInitialSummaryLoaded(true);
        }
      }
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmployee(null);
    setShifts([]);
    setSummary(null);
    setInitialShiftsLoaded(false);
    setInitialSummaryLoaded(false);
    setAvatarMessage("");
    setToast({ message: "Đã đăng xuất", tone: "warn" });
    router.replace("/auth");
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

      const savedShift = saveData.shift as Shift;
      setShifts((prev) => {
        const next = prev.filter((item) => item.id !== savedShift.id);
        next.unshift(savedShift);
        return next.slice(0, 120);
      });

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

  const isPageReady =
    authResolved && (!employee || (initialShiftsLoaded && initialSummaryLoaded));

  if (!isPageReady) {
    return (
      <AppBackground>
        <FullPageLoader />
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <AppHeader
          employee={employee ? { fullName: employee.fullName, employeeCode: employee.employeeCode } : null}
          onTheme={setTheme}
          theme={theme}
        />

        <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          {employee ? (
            <EmployeeCard
              avatarMessage={avatarMessage}
              avatarUploading={avatarUploading}
              avatarUrl={getAvatarUrl(employee.avatarPath)}
              employee={employee}
              onAvatarFileChange={(file) => {
                void handleAvatarUpload(file);
              }}
              onLogout={handleLogout}
              onScrollToSummary={scrollToSummary}
              onScrollToTimesheet={scrollToTimesheet}
              primaryButtonClass={primaryButtonClass}
              reminders={reminders}
              secondaryButtonClass={secondaryButtonClass}
              todayEvidenceStatus={todayEvidenceStatus}
              todayShiftStatus={todayShiftStatus}
            />
          ) : null}

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
            <p className="mt-3 text-sm text-[color:var(--muted)]">Đơn giá hiện tại: {moneyLabel(employee?.hourlyRate ?? DEFAULT_RATE)}/giờ</p>
          </div>
        </section>

        <div ref={timesheetSectionRef}>
          <TimesheetForm
            canSave={Boolean(employee)}
            breakIn={breakIn}
            breakOut={breakOut}
            entryMessage={entryMessage}
            evidenceFileName={evidenceFile?.name ?? ""}
            inputClass={inputClass}
            liveBreakMinutes={liveMetrics.breakMinutes}
            liveWorkHours={hoursLabel(liveMetrics.workMinutes)}
            onChangeBreakIn={setBreakIn}
            onChangeBreakOut={setBreakOut}
            onChangeEvidence={setEvidenceFile}
            onChangeShiftIndex={setShiftIndex}
            onChangeTimeIn={setTimeIn}
            onChangeTimeOut={setTimeOut}
            onChangeWorkDate={setWorkDate}
            onSubmit={handleSaveShift}
            saveLoading={saveLoading}
            shiftIndex={shiftIndex}
            timeIn={timeIn}
            timeOut={timeOut}
            useNativePickers={useNativePickers}
            workDate={workDate}
          />
        </div>

        <section className="grid gap-5 lg:grid-cols-2" ref={summarySectionRef}>
          <SummaryPanel
            inputClass={inputClass}
            isRangeValid={isRangeValid}
            onQuickRange={applyQuickRange}
            onRangeFrom={setRangeFrom}
            onRangeTo={setRangeTo}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            secondaryButtonClass={secondaryButtonClass}
            summary={summary}
            summaryLoading={summaryLoading}
            useNativePickers={useNativePickers}
          />

          <LazyDashboardComparison
            hasSummary={Boolean(summary)}
            isRangeValid={isRangeValid}
            monthly={summary?.monthly ?? []}
            monthlyConsistencyOk={monthlyConsistencyOk}
            summaryLoading={summaryLoading}
            weekly={summary?.weekly ?? []}
            weeklyConsistencyOk={weeklyConsistencyOk}
          />
        </section>

        <LazyShiftsTable
          currentPage={currentPage}
          deletingShiftId={deletingShiftId}
          getEvidenceUrl={getEvidenceUrl}
          onChangePage={setCurrentPage}
          onDeleteShift={handleDeleteShift}
          onExportCsv={exportShiftsToCsv}
          onOpenEvidence={openEvidencePreview}
          secondaryButtonClass={secondaryButtonClass}
          shifts={shifts}
          shiftsLoading={shiftsLoading}
        />

        <LazyEvidenceModal
          hasMultiple={previewImageItems.length > 1}
          imageAlt={previewImageAlt}
          imageUrl={previewImageUrl}
          onClose={closeEvidencePreview}
          onNext={goNextPreviewImage}
          onPrev={goPrevPreviewImage}
          open={Boolean(previewImageUrl)}
        />

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
    </AppBackground>
  );
}
