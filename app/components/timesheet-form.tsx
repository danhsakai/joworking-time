"use client";

import { DatePickerField, TimePickerField } from "@/app/components/pickers";

export default function TimesheetForm({
  workDate,
  shiftIndex,
  timeIn,
  timeOut,
  breakIn,
  breakOut,
  evidenceFileName,
  useNativePickers,
  inputClass,
  saveLoading,
  canSave,
  entryMessage,
  liveBreakMinutes,
  liveWorkHours,
  onChangeWorkDate,
  onChangeShiftIndex,
  onChangeTimeIn,
  onChangeTimeOut,
  onChangeBreakIn,
  onChangeBreakOut,
  onChangeEvidence,
  onSubmit,
}: {
  workDate: string;
  shiftIndex: 1 | 2;
  timeIn: string;
  timeOut: string;
  breakIn: string;
  breakOut: string;
  evidenceFileName: string;
  useNativePickers: boolean;
  inputClass: string;
  saveLoading: boolean;
  canSave: boolean;
  entryMessage: string;
  liveBreakMinutes: number;
  liveWorkHours: string;
  onChangeWorkDate: (value: string) => void;
  onChangeShiftIndex: (value: 1 | 2) => void;
  onChangeTimeIn: (value: string) => void;
  onChangeTimeOut: (value: string) => void;
  onChangeBreakIn: (value: string) => void;
  onChangeBreakOut: (value: string) => void;
  onChangeEvidence: (file: File | null) => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return (
    <section className="card rounded-2xl p-5 sm:p-6">
      <h2 className="font-mono text-xl font-semibold">Nhập giờ công mỗi ngày</h2>
      <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          {useNativePickers ? (
            <label className="text-sm">
              Ngày
              <input
                className={inputClass}
                onChange={(event) => onChangeWorkDate(event.target.value)}
                type="date"
                value={workDate}
              />
            </label>
          ) : (
            <DatePickerField label="Ngày" onChange={onChangeWorkDate} value={workDate} />
          )}

          <label className="text-sm">
            Ca làm
            <select
              className={inputClass}
              onChange={(event) => onChangeShiftIndex(Number(event.target.value) as 1 | 2)}
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
                    onChange={(event) => onChangeTimeIn(event.target.value)}
                    type="time"
                    value={timeIn}
                  />
                </label>
              ) : (
                <TimePickerField label="Giờ vào" onChange={onChangeTimeIn} value={timeIn} />
              )}
              <span className="pb-2 text-[color:var(--muted)]">→</span>
              {useNativePickers ? (
                <label className="text-sm">
                  Giờ ra
                  <input
                    className={inputClass}
                    onChange={(event) => onChangeTimeOut(event.target.value)}
                    type="time"
                    value={timeOut}
                  />
                </label>
              ) : (
                <TimePickerField label="Giờ ra" onChange={onChangeTimeOut} value={timeOut} />
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
                    onChange={(event) => onChangeBreakIn(event.target.value)}
                    type="time"
                    value={breakIn}
                  />
                </label>
              ) : (
                <TimePickerField label="Bắt đầu" onChange={onChangeBreakIn} value={breakIn} />
              )}
              <span className="pb-2 text-[color:var(--muted)]">→</span>
              {useNativePickers ? (
                <label className="text-sm">
                  Kết thúc
                  <input
                    className={inputClass}
                    onChange={(event) => onChangeBreakOut(event.target.value)}
                    type="time"
                    value={breakOut}
                  />
                </label>
              ) : (
                <TimePickerField label="Kết thúc" onChange={onChangeBreakOut} value={breakOut} />
              )}
            </div>
          </div>
        </div>

        <label className="text-sm">
          Ảnh bằng chứng {evidenceFileName ? `(${evidenceFileName})` : ""}
          <input
            accept="image/*"
            className="mt-1 w-full rounded-xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none"
            onChange={(event) => onChangeEvidence(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>

        <div>
          {entryMessage ? (
            <p className="text-sm text-[color:var(--muted)]">{entryMessage}</p>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">
              Nghỉ: {liveBreakMinutes} phút | Giờ công: {liveWorkHours} h
            </p>
          )}
          <button
            className="mt-3 rounded-xl bg-[color:var(--accent-2)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={!canSave || saveLoading}
            type="submit"
          >
            {saveLoading ? "Đang lưu..." : "Lưu giờ công"}
          </button>
          {!canSave ? (
            <p className="mt-2 text-xs text-[color:var(--warn)]">Cần đăng nhập trước khi lưu.</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
