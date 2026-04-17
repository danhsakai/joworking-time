import Image from "next/image";
import { useRef } from "react";

type Employee = {
  id: string;
  fullName: string;
  employeeCode: string;
  avatarPath: string | null;
  hourlyRate: number;
};

type ReminderItem = {
  text: string;
  tone: "warn" | "ok";
};

function moneyLabel(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

export default function EmployeeCard({
  employee,
  avatarUrl,
  avatarUploading,
  avatarMessage,
  todayShiftStatus,
  todayEvidenceStatus,
  reminders,
  primaryButtonClass,
  secondaryButtonClass,
  onAvatarFileChange,
  onScrollToTimesheet,
  onScrollToSummary,
  onLogout,
}: {
  employee: Employee;
  avatarUrl: string | null;
  avatarUploading: boolean;
  avatarMessage: string;
  todayShiftStatus: string;
  todayEvidenceStatus: string;
  reminders: ReminderItem[];
  primaryButtonClass: string;
  secondaryButtonClass: string;
  onAvatarFileChange: (file: File) => void;
  onScrollToTimesheet: () => void;
  onScrollToSummary: () => void;
  onLogout: () => void;
}) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="card rounded-2xl p-5 sm:p-6">
      <h2 className="font-mono text-xl font-semibold">Thẻ nhân viên</h2>

      <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-3 sm:flex-row sm:items-center sm:gap-4">
        {avatarUrl ? (
          <Image
            alt="Ảnh đại diện"
            className="h-16 w-16 rounded-full border border-[color:var(--line)] object-cover"
            src={avatarUrl}
            width={64}
            height={64}
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] text-lg font-semibold">
            {employee.fullName.slice(0, 1).toUpperCase() ?? "?"}
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
              if (file) onAvatarFileChange(file);
            }}
            ref={avatarInputRef}
            type="file"
          />
          {avatarMessage ? <p className="text-xs text-[color:var(--muted)]">{avatarMessage}</p> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="soft-card rounded-xl p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">Trạng thái hôm nay</p>
          <p className="mt-1 text-base font-semibold">{todayShiftStatus}</p>
        </div>
        <div className="soft-card rounded-xl p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Ảnh bằng chứng hôm nay
          </p>
          <p className="mt-1 text-base font-semibold">{todayEvidenceStatus}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold">Hành động nhanh</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            className={`${primaryButtonClass} w-full sm:w-auto`}
            onClick={onScrollToTimesheet}
            type="button"
          >
            Chấm công hôm nay
          </button>
          <button
            className={`${secondaryButtonClass} w-full sm:w-auto`}
            onClick={onScrollToSummary}
            type="button"
          >
            Xem tổng hợp
          </button>
          <button className={`${secondaryButtonClass} w-full sm:w-auto`} onClick={onLogout} type="button">
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
  );
}
