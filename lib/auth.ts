import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is not configured");
  }

  return encoder.encode(secret);
}

export type SessionPayload = {
  employeeId: string;
  employeeCode: string;
  fullName: string;
};

export async function hashPassword(plainPassword: string) {
  return bcrypt.hash(plainPassword, 12);
}

export async function verifyPassword(plainPassword: string, hash: string) {
  return bcrypt.compare(plainPassword, hash);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySession(token: string) {
  const result = await jwtVerify<SessionPayload>(token, getJwtSecret());
  return result.payload;
}
