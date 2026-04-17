type SummaryItem = {
  key: string;
  workMinutes: number;
  salaryAmount: number;
};

function hoursLabel(minutes: number) {
  return (minutes / 60).toFixed(2);
}

function moneyLabel(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

export default function DashboardComparison({
  summaryLoading,
  hasSummary,
  isRangeValid,
  weekly,
  monthly,
  weeklyConsistencyOk,
  monthlyConsistencyOk,
}: {
  summaryLoading: boolean;
  hasSummary: boolean;
  isRangeValid: boolean;
  weekly: SummaryItem[];
  monthly: SummaryItem[];
  weeklyConsistencyOk: boolean;
  monthlyConsistencyOk: boolean;
}) {
  return (
    <div className="card rounded-2xl p-5 sm:p-6">
      <h2 className="font-mono text-xl font-semibold">Bảng điều khiển</h2>
      <p className="mt-1 text-sm text-[color:var(--muted)]">
        So sánh tổng giờ công và lương theo tuần/tháng.
      </p>
      {hasSummary && !(weeklyConsistencyOk && monthlyConsistencyOk) ? (
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
            ) : !hasSummary || !isRangeValid || weekly.length === 0 ? (
              <li className="text-[color:var(--muted)]">Chưa có dữ liệu.</li>
            ) : (
              weekly.map((item) => (
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
                            (item.workMinutes / Math.max(...weekly.map((value) => value.workMinutes), 1)) *
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
            ) : !hasSummary || !isRangeValid || monthly.length === 0 ? (
              <li className="text-[color:var(--muted)]">Chưa có dữ liệu.</li>
            ) : (
              monthly.map((item) => (
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
                            (item.workMinutes / Math.max(...monthly.map((value) => value.workMinutes), 1)) *
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
  );
}
