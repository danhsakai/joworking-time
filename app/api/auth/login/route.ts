import { NextResponse } from "next/server";

import { signSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { employeeCodeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const payload = await request.json();
  const employeeCode = employeeCodeSchema.safeParse(payload.employeeCode);
  const password = String(payload.password ?? "");

  if (!employeeCode.success || password.length < 6) {
    return NextResponse.json(
      {
        message: "Thong tin dang nhap khong hop le",
      },
      { status: 400 },
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { employeeCode: employeeCode.data },
  });

  if (!employee) {
    return NextResponse.json(
      {
        message: "Sai ma nhan vien hoac mat khau",
      },
      { status: 401 },
    );
  }

  const isValid = await verifyPassword(password, employee.passwordHash);

  if (!isValid) {
    return NextResponse.json(
      {
        message: "Sai ma nhan vien hoac mat khau",
      },
      { status: 401 },
    );
  }

  const token = await signSession({
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
  });

  const response = NextResponse.json({
    employee: {
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      avatarPath: employee.avatarPath,
      hourlyRate: employee.hourlyRate,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
