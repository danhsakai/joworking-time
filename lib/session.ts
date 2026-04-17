import { cookies } from "next/headers";

import { verifySession } from "@/lib/auth";

export const SESSION_COOKIE_NAME = "jowt_session";

export async function getSessionPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}
