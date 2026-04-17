import { NextResponse } from "next/server";

import {
  endOfDateOnlyToUtc,
  formatUtcDateOnly,
  parseDateOnlyToUtc,
  weekKeyFromDateOnly,
} from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { reportRangeSchema } from "@/lib/validators";

function monthKey(dateText: string) {
  return dateText.slice(0, 7);
}

function previousPeriod(from: Date, to: Date) {
  const duration = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - duration);
  return { prevFrom, prevTo };
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export async function GET(request: Request) {
  const session = await getSessionPayload();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = reportRangeSchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Khoang ngay khong hop le" },
      { status: 400 },
    );
  }

  const fromDate = parseDateOnlyToUtc(parsed.data.from);
  const toDate = endOfDateOnlyToUtc(parsed.data.to);
  const { prevFrom, prevTo } = previousPeriod(fromDate, toDate);

  const shifts = await prisma.shift.findMany({
    where: {
      employeeId: session.employeeId,
      workDate: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: { workDate: "asc" },
    select: {
      workDate: true,
      workMinutes: true,
      salaryAmount: true,
    },
  });

  const previousShifts = await prisma.shift.findMany({
    where: {
      employeeId: session.employeeId,
      workDate: {
        gte: prevFrom,
        lte: prevTo,
      },
    },
    select: {
      workMinutes: true,
      salaryAmount: true,
    },
  });

  const total = { workMinutes: 0, salaryAmount: 0 };
  for (const shift of shifts) {
    total.workMinutes += shift.workMinutes;
    total.salaryAmount += shift.salaryAmount;
  }

  const previousTotal = { workMinutes: 0, salaryAmount: 0 };
  for (const shift of previousShifts) {
    previousTotal.workMinutes += shift.workMinutes;
    previousTotal.salaryAmount += shift.salaryAmount;
  }

  const byWeek = new Map<string, { workMinutes: number; salaryAmount: number }>();
  const byMonth = new Map<string, { workMinutes: number; salaryAmount: number }>();

  for (const shift of shifts) {
    const dateKey = formatUtcDateOnly(shift.workDate);

    const wk = weekKeyFromDateOnly(dateKey);
    const prevWeek = byWeek.get(wk) ?? { workMinutes: 0, salaryAmount: 0 };
    byWeek.set(wk, {
      workMinutes: prevWeek.workMinutes + shift.workMinutes,
      salaryAmount: prevWeek.salaryAmount + shift.salaryAmount,
    });

    const mk = monthKey(dateKey);
    const prevMonth = byMonth.get(mk) ?? { workMinutes: 0, salaryAmount: 0 };
    byMonth.set(mk, {
      workMinutes: prevMonth.workMinutes + shift.workMinutes,
      salaryAmount: prevMonth.salaryAmount + shift.salaryAmount,
    });
  }

  return NextResponse.json({
    total,
    previousTotal,
    change: {
      workMinutesPct: percentChange(total.workMinutes, previousTotal.workMinutes),
      salaryAmountPct: percentChange(total.salaryAmount, previousTotal.salaryAmount),
    },
    weekly: Array.from(byWeek.entries()).map(([key, value]) => ({ key, ...value })),
    monthly: Array.from(byMonth.entries()).map(([key, value]) => ({ key, ...value })),
  });
}
