"use client";

import Image from "next/image";

const PAGE_SIZE = 10;

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

export default function ShiftsTable({
  shifts,
  shiftsLoading,
  currentPage,
  deletingShiftId,
  secondaryButtonClass,
  onChangePage,
  onExportCsv,
  onDeleteShift,
  onOpenEvidence,
  getEvidenceUrl,
}: {
  shifts: Shift[];
  shiftsLoading: boolean;
  currentPage: number;
  deletingShiftId: string | null;
  secondaryButtonClass: string;
  onChangePage: (next: number) => void;
  onExportCsv: () => void;
  onDeleteShift: (id: string) => void;
  onOpenEvidence: (url: string, alt: string) => void;
  getEvidenceUrl: (path: string | null | undefined) => string | null;
}) {
  const totalPages = Math.max(1, Math.ceil(shifts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const start = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedShifts = shifts.slice(start, start + PAGE_SIZE);

  return (
    <section className="card rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xl font-semibold">Danh sách chấm công</h2>
        <button className={secondaryButtonClass} onClick={onExportCsv} type="button">
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
                <tr
                  className="border-b border-[color:var(--line)] odd:bg-[color:var(--surface)] even:bg-[color:var(--surface-soft)]"
                  key={shift.id}
                >
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
                          onOpenEvidence(
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
                      onClick={() => onDeleteShift(shift.id)}
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
              onClick={() => onChangePage(Math.max(1, safeCurrentPage - 1))}
              type="button"
            >
              Trước
            </button>
            <button
              className={`${secondaryButtonClass} flex-1 sm:flex-none`}
              disabled={safeCurrentPage === totalPages}
              onClick={() => onChangePage(Math.min(totalPages, safeCurrentPage + 1))}
              type="button"
            >
              Sau
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
