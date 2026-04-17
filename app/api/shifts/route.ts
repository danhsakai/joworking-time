import { NextResponse } from "next/server";

import { parseDateOnlyToUtc } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { shiftSchema } from "@/lib/validators";

function toMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export async function GET() {
  const session = await getSessionPayload();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const shifts = await prisma.shift.findMany({
    where: {
      employeeId: session.employeeId,
    },
    orderBy: [{ workDate: "desc" }, { shiftIndex: "asc" }],
    take: 120,
    select: {
      id: true,
      workDate: true,
      shiftIndex: true,
      timeInMinutes: true,
      timeOutMinutes: true,
      breakInMinutes: true,
      breakOutMinutes: true,
      breakMinutes: true,
      workMinutes: true,
      salaryAmount: true,
      evidencePath: true,
    },
  });

  return NextResponse.json({ shifts });
}

export async function POST(request: Request) {
  const session = await getSessionPayload();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = shiftSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "Du lieu cham cong khong hop le",
      },
      { status: 400 },
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { id: session.employeeId },
    select: { id: true, hourlyRate: true },
  });

  if (!employee) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { workDate, shiftIndex, timeIn, timeOut, breakIn, breakOut, evidencePath } = parsed.data;

  const timeInMinutes = toMinutes(timeIn);
  const timeOutMinutes = toMinutes(timeOut);
  const breakInMinutes = toMinutes(breakIn);
  const breakOutMinutes = toMinutes(breakOut);
  const breakMinutes = breakOutMinutes - breakInMinutes;
  const workMinutes = timeOutMinutes - timeInMinutes - breakMinutes;
  const salaryAmount = Math.round((workMinutes / 60) * employee.hourlyRate);

  const workDateObj = parseDateOnlyToUtc(workDate);

  const shift = await prisma.shift.upsert({
    where: {
      employeeId_workDate_shiftIndex: {
        employeeId: employee.id,
        workDate: workDateObj,
        shiftIndex,
      },
    },
    update: {
      shiftIndex,
      timeInMinutes,
      timeOutMinutes,
      breakInMinutes,
      breakOutMinutes,
      breakMinutes,
      workMinutes,
      salaryAmount,
      evidencePath,
    },
    create: {
      employeeId: employee.id,
      workDate: workDateObj,
      shiftIndex,
      timeInMinutes,
      timeOutMinutes,
      breakInMinutes,
      breakOutMinutes,
      breakMinutes,
      workMinutes,
      salaryAmount,
      evidencePath,
    },
  });

  return NextResponse.json({
    shift: {
      id: shift.id,
      workDate: shift.workDate,
      shiftIndex: shift.shiftIndex,
      timeInMinutes: shift.timeInMinutes,
      timeOutMinutes: shift.timeOutMinutes,
      breakInMinutes: shift.breakInMinutes,
      breakOutMinutes: shift.breakOutMinutes,
      breakMinutes: shift.breakMinutes,
      workMinutes: shift.workMinutes,
      salaryAmount: shift.salaryAmount,
      evidencePath: shift.evidencePath,
    },
  });
}

export async function DELETE(request: Request) {
  const session = await getSessionPayload();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "Thieu id ngay cong" }, { status: 400 });
  }

  const deleted = await prisma.shift.deleteMany({
    where: {
      id,
      employeeId: session.employeeId,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ message: "Khong tim thay ngay cong" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
