"use client";

import { DatePickerField } from "@/app/components/pickers";

function hoursLabel(minutes: number) {
  return (minutes / 60).toFixed(2);
}

function moneyLabel(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

type RangeSummary = {
  total: { workMinutes: number; salaryAmount: number };
  previousTotal: { workMinutes: number; salaryAmount: number };
  change: { workMinutesPct: number; salaryAmountPct: number };
  weekly: Array<{ key: string; workMinutes: number; salaryAmount: number }>;
  monthly: Array<{ key: string; workMinutes: number; salaryAmount: number }>;
};

export default function SummaryPanel({
  summary,
  summaryLoading,
  isRangeValid,
  useNativePickers,
  inputClass,
  rangeFrom,
  rangeTo,
  secondaryButtonClass,
  onQuickRange,
  onRangeFrom,
  onRangeTo,
}: {
  summary: RangeSummary | null;
  summaryLoading: boolean;
  isRangeValid: boolean;
  useNativePickers: boolean;
  inputClass: string;
  rangeFrom: string;
  rangeTo: string;
  secondaryButtonClass: string;
  onQuickRange: (preset: "today" | "week" | "month") => void;
  onRangeFrom: (value: string) => void;
  onRangeTo: (value: string) => void;
}) {
  return (
    <div className="card rounded-2xl p-5 sm:p-6">
      <h2 className="font-mono text-xl font-semibold">Tổng hợp theo khoảng ngày</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={`${secondaryButtonClass} flex-1 min-w-[92px] sm:flex-none`}
          onClick={() => onQuickRange("today")}
          type="button"
        >
          Hôm nay
        </button>
        <button
          className={`${secondaryButtonClass} flex-1 min-w-[92px] sm:flex-none`}
          onClick={() => onQuickRange("week")}
          type="button"
        >
          Tuần này
        </button>
        <button
          className={`${secondaryButtonClass} flex-1 min-w-[92px] sm:flex-none`}
          onClick={() => onQuickRange("month")}
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
              onChange={(event) => onRangeFrom(event.target.value)}
              type="date"
              value={rangeFrom}
            />
          </label>
        ) : (
          <DatePickerField label="Từ ngày" onChange={onRangeFrom} value={rangeFrom} />
        )}

        {useNativePickers ? (
          <label className="text-sm">
            Đến ngày
            <input
              className={inputClass}
              onChange={(event) => onRangeTo(event.target.value)}
              type="date"
              value={rangeTo}
            />
          </label>
        ) : (
          <DatePickerField label="Đến ngày" onChange={onRangeTo} value={rangeTo} />
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="soft-card rounded-xl p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">Tổng giờ công</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {summaryLoading
              ? "..."
              : summary && isRangeValid
                ? `${hoursLabel(summary.total.workMinutes)} h`
                : "0.00 h"}
          </p>
        </div>
        <div className="soft-card rounded-xl p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">Tổng lương</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {summaryLoading
              ? "..."
              : summary && isRangeValid
                ? moneyLabel(summary.total.salaryAmount)
                : moneyLabel(0)}
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="soft-card rounded-xl p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">So với kỳ trước (giờ)</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {summaryLoading || !summary
              ? "..."
              : `${summary.change.workMinutesPct >= 0 ? "+" : ""}${summary.change.workMinutesPct}%`}
          </p>
        </div>
        <div className="soft-card rounded-xl p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">So với kỳ trước (lương)</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {summaryLoading || !summary
              ? "..."
              : `${summary.change.salaryAmountPct >= 0 ? "+" : ""}${summary.change.salaryAmountPct}%`}
          </p>
        </div>
      </div>
    </div>
  );
}
