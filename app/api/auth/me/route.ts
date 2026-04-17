import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

export async function GET() {
  const session = await getSessionPayload();

  if (!session) {
    return NextResponse.json({ employee: null }, { status: 401 });
  }

  const employee = await prisma.employee.findUnique({
    where: { id: session.employeeId },
    select: {
      id: true,
      fullName: true,
      employeeCode: true,
      avatarPath: true,
      hourlyRate: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ employee: null }, { status: 401 });
  }

  return NextResponse.json({ employee });
}
