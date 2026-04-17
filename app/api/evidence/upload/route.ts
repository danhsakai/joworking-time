import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { getSessionPayload } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase";

const EVIDENCE_BUCKET = "timesheet-evidence";

export async function POST(request: Request) {
  const session = await getSessionPayload();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "Only image files are allowed" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : ".jpg";
  const path = `${session.employeeCode}/${Date.now()}-${randomUUID()}${extension}`;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, buffer, {
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(EVIDENCE_BUCKET).getPublicUrl(path);

  return NextResponse.json({
    path,
    publicUrl: data.publicUrl,
  });
}
