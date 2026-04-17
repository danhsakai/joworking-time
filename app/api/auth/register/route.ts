import { NextResponse } from "next/server";

import { hashPassword, signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { authSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = authSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "Du lieu khong hop le",
      },
      { status: 400 },
    );
  }

  const { fullName, employeeCode, password } = parsed.data;
  const existing = await prisma.employee.findUnique({
    where: { employeeCode },
  });

  if (existing) {
    return NextResponse.json(
      {
        message: "Ma nhan vien da ton tai",
      },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const employee = await prisma.employee.create({
    data: {
      fullName,
      employeeCode,
      passwordHash,
    },
  });

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
