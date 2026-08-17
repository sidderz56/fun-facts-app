"use server";

// spec 5.7: "Permitted write actions, and nothing else" — this file is
// deliberately the complete list. Every action re-checks requireAdminSession()
// itself rather than trusting that the dashboard page already did (Next's
// own auth guidance: Server Actions are reachable independently of the UI
// that renders a form pointing at them, so page-level gating alone isn't
// sufficient). Every action passes actor: "founder" — spec 3.5's fixed
// value for a human-operator action, not the signed-in GitHub username.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/adminAuth";
import { resolveReports as resolveReportsMutation } from "@/lib/reporting";
import {
  confirmReverification as confirmReverificationMutation,
  retireFact,
  restoreFact,
  editFactText,
  rescoreFact,
} from "@/lib/factMutations";
import type { RetiredReason } from "@/app/generated/prisma/client";

const ACTOR = "founder";

export async function markReviewedAction(factId: string) {
  await requireAdminSession();
  await resolveReportsMutation(factId);
  revalidatePath("/admin");
}

export async function confirmReverificationAction(formData: FormData) {
  await requireAdminSession();
  const factId = String(formData.get("factId"));
  const explicitDueDateRaw = formData.get("explicitDueDate");
  const explicitDueDate =
    typeof explicitDueDateRaw === "string" && explicitDueDateRaw.length > 0
      ? new Date(explicitDueDateRaw)
      : null;
  await confirmReverificationMutation(factId, ACTOR, explicitDueDate);
  revalidatePath("/admin");
}

export async function retireFactAction(formData: FormData) {
  await requireAdminSession();
  const factId = String(formData.get("factId"));
  const retiredReason = String(formData.get("retiredReason")) as RetiredReason;
  const reason = String(formData.get("reason"));
  const supersededByShareSlug = String(formData.get("supersededByShareSlug") ?? "").trim();

  let supersededById: string | undefined;
  if (supersededByShareSlug) {
    const replacement = await prisma.fact.findUnique({ where: { shareSlug: supersededByShareSlug } });
    supersededById = replacement?.id;
  }

  await retireFact(factId, { reason, actor: ACTOR, retiredReason, supersededById });
  revalidatePath("/admin");
}

export async function restoreFactAction(formData: FormData) {
  await requireAdminSession();
  const factId = String(formData.get("factId"));
  const reason = String(formData.get("reason"));
  await restoreFact(factId, { reason, actor: ACTOR });
  revalidatePath("/admin");
}

export async function editFactTextAction(formData: FormData) {
  await requireAdminSession();
  const factId = String(formData.get("factId"));
  const newText = String(formData.get("newText"));
  const reason = String(formData.get("reason"));
  await editFactText(factId, newText, { reason, actor: ACTOR });
  revalidatePath("/admin");
}

export async function rescoreFactAction(formData: FormData) {
  await requireAdminSession();
  const factId = String(formData.get("factId"));
  const newScore = Number(formData.get("newScore"));
  await rescoreFact(factId, newScore, ACTOR);
  revalidatePath("/admin");
}
