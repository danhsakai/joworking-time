"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = {
  id: string;
  fullName: string;
  employeeCode: string;
  avatarPath: string | null;
  hourlyRate: number;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm shadow-sm transition focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/20";

const primaryButtonClass =
  "rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-60 disabled:hover:translate-y-0";

export default function AuthPage() {
  const router = useRouter();

  const [activeAuthMode, setActiveAuthMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const init = async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { employee: Employee };
        if (data.employee) {
          router.replace("/");
          return;
        }
      }
      setCheckingSession(false);
    };

    void init();
  }, [router]);

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
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setAuthMessage("Không thể kết nối tới máy chủ");
    } finally {
      setAuthLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d6e8ff_0%,transparent_43%),radial-gradient(circle_at_bottom_right,#d9f2ff_0%,transparent_36%),linear-gradient(180deg,#f8fbff_0%,var(--background)_40%)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,#14365f_0%,transparent_42%),radial-gradient(circle_at_bottom_right,#12304f_0%,transparent_35%),linear-gradient(180deg,#0f1d32_0%,var(--background)_40%)]">
        <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="card flex w-full max-w-md flex-col items-center rounded-2xl px-6 py-8 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--line)] border-t-[color:var(--accent)]" />
            <p className="mt-4 font-mono text-lg font-semibold">Đang kiểm tra phiên đăng nhập</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d6e8ff_0%,transparent_43%),radial-gradient(circle_at_bottom_right,#d9f2ff_0%,transparent_36%),linear-gradient(180deg,#f8fbff_0%,var(--background)_40%)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,#14365f_0%,transparent_42%),radial-gradient(circle_at_bottom_right,#12304f_0%,transparent_35%),linear-gradient(180deg,#0f1d32_0%,var(--background)_40%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <form className="card w-full max-w-md rounded-2xl p-5 sm:p-6" onSubmit={handleAuth}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            JO WORKING TIME
          </p>
          <h1 className="mt-2 font-mono text-2xl font-semibold">Đăng nhập tài khoản</h1>

          <div className="mt-4 flex items-center justify-between gap-2">
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

          {authMessage ? <p className="mt-3 text-sm text-[color:var(--muted)]">{authMessage}</p> : null}

          <button className={`mt-4 w-full ${primaryButtonClass}`} disabled={authLoading} type="submit">
            {authLoading
              ? "Đang xử lý..."
              : activeAuthMode === "login"
                ? "Đăng nhập"
                : "Đăng ký"}
          </button>
        </form>
      </main>
    </div>
  );
}
