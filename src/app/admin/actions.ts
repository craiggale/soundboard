"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminConfigured, endSession, isAdmin, passwordMatches, startSession } from "@/lib/admin-auth";
import * as admin from "@/lib/admin-data";

export type ActionResult = { error?: string };

const failures = new Map<string, { count: number; until: number }>();
const MAX_FAILURES = 8;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function login(_: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!adminConfigured()) return { error: "Admin isn't set up yet. Set ADMIN_PASSWORD on the server." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const record = failures.get(ip);
  if (record && record.count >= MAX_FAILURES && record.until > Date.now()) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }

  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    failures.set(ip, { count: (record?.until ?? 0) > Date.now() ? record!.count + 1 : 1, until: Date.now() + LOCKOUT_MS });
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { error: "That password isn't right." };
  }

  failures.delete(ip);
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

async function run(task: () => Promise<unknown>): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: "Your session has expired. Sign in again." };
  try {
    await task();
  } catch (error) {
    if (error instanceof admin.AdminError) return { error: error.message };
    if (error instanceof z.ZodError) return { error: "Some of those details aren't valid." };
    throw error;
  }
  refresh();
  return {};
}

const id = z.string().min(1).max(80);
const direction = z.union([z.literal(-1), z.literal(1)]);

const toolInput = z.object({
  id: id.optional(),
  name: z.string().max(200),
  emerging: z.boolean(),
  hidden: z.boolean(),
  categoryIds: z.array(id).max(50),
  logo: z.string().max(80),
});
const categoryInput = z.object({
  id: id.optional(),
  name: z.string().max(200),
  purpose: z.string().max(200),
  alwaysShown: z.boolean(),
  hidden: z.boolean(),
});
const practiceInput = z.object({
  id: id.optional(),
  name: z.string().max(200),
  summary: z.string().max(400),
  hidden: z.boolean(),
});
const barrierInput = z.object({ id: id.optional(), label: z.string().max(300), hidden: z.boolean() });

export async function saveTool(input: admin.ToolInput) {
  return run(() => admin.saveTool(toolInput.parse(input)));
}
export async function deleteTool(toolId: string) {
  return run(() => admin.deleteTool(id.parse(toolId)));
}

export async function saveCategory(input: admin.CategoryInput) {
  return run(() => admin.saveCategory(categoryInput.parse(input)));
}
export async function deleteCategory(categoryId: string) {
  return run(() => admin.deleteCategory(id.parse(categoryId)));
}
export async function moveCategory(categoryId: string, dir: -1 | 1) {
  return run(() => admin.moveCategory(id.parse(categoryId), direction.parse(dir)));
}

export async function savePractice(input: admin.PracticeInput) {
  return run(() => admin.savePractice(practiceInput.parse(input)));
}
export async function deletePractice(practiceId: string) {
  return run(() => admin.deletePractice(id.parse(practiceId)));
}
export async function movePractice(practiceId: string, dir: -1 | 1) {
  return run(() => admin.movePractice(id.parse(practiceId), direction.parse(dir)));
}

export async function saveBarrier(input: admin.BarrierInput) {
  return run(() => admin.saveBarrier(barrierInput.parse(input)));
}
export async function deleteBarrier(barrierId: string) {
  return run(() => admin.deleteBarrier(id.parse(barrierId)));
}
export async function moveBarrier(barrierId: string, dir: -1 | 1) {
  return run(() => admin.moveBarrier(id.parse(barrierId), direction.parse(dir)));
}
