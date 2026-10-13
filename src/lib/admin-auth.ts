import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

const COOKIE = "soundboard_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

// Derived from the password, so changing ADMIN_PASSWORD signs everyone out.
function signingKey(): Buffer | null {
  const password = process.env.ADMIN_PASSWORD;
  return password ? createHash("sha256").update(`soundboard-admin-session:${password}`).digest() : null;
}

function sign(payload: string, key: Buffer) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function passwordMatches(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return safeEqual(digest(input), digest(password));
}

function verify(token: string | undefined) {
  const key = signingKey();
  if (!key || !token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (!safeEqual(Buffer.from(signature), Buffer.from(sign(expires, key)))) return false;
  return Number(expires) > Date.now();
}

export async function isAdmin() {
  await connection();
  return verify((await cookies()).get(COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function startSession() {
  const key = signingKey();
  if (!key) throw new Error("ADMIN_PASSWORD is not set.");
  const expires = String(Date.now() + MAX_AGE_SECONDS * 1000);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}
