type EmployeeHeader = {
  fullName: string;
  employeeCode: string;
};

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d6e8ff_0%,transparent_43%),radial-gradient(circle_at_bottom_right,#d9f2ff_0%,transparent_36%),linear-gradient(180deg,#f8fbff_0%,var(--background)_40%)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,#14365f_0%,transparent_42%),radial-gradient(circle_at_bottom_right,#12304f_0%,transparent_35%),linear-gradient(180deg,#0f1d32_0%,var(--background)_40%)]">
      {children}
    </div>
  );
}

export function AppHeader({
  theme,
  onTheme,
  employee,
}: {
  theme: "light" | "dark";
  onTheme: (theme: "light" | "dark") => void;
  employee: EmployeeHeader | null;
}) {
  return (
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
                theme === "light" ? "bg-[color:var(--accent)] text-white" : "text-[color:var(--muted)]"
              }`}
              onClick={() => onTheme("light")}
              type="button"
            >
              Sáng
            </button>
            <button
              className={`rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                theme === "dark" ? "bg-[color:var(--accent)] text-white" : "text-[color:var(--muted)]"
              }`}
              onClick={() => onTheme("dark")}
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
  );
}

export function FullPageLoader() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="card rounded-2xl bg-[linear-gradient(135deg,rgba(15,111,232,0.07),transparent_42%)] px-5 py-5 sm:px-7 dark:bg-[linear-gradient(135deg,rgba(85,191,255,0.12),transparent_42%)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          JO WORKING TIME
        </p>
        <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
          Theo dõi giờ công part-time và tính lương
        </h1>
      </header>

      <section className="card flex min-h-[52vh] items-center justify-center rounded-2xl px-6 py-8 text-center">
        <div className="flex w-full max-w-md flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--line)] border-t-[color:var(--accent)]" />
          <p className="mt-4 font-mono text-lg font-semibold">Đang tải JoWorking Time</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Đang xác thực tài khoản và đồng bộ dữ liệu...</p>
        </div>
      </section>
    </main>
  );
}
