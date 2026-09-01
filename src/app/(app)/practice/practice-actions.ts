"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { ok: true };

export type ScoreInput = {
  taken_on: string;
  raw_score: string;
  max_score: string;
  placement: string;
  notes: string;
};

function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

// Record one practice-test attempt for a pairing. The pairing's trend is the
// ordered set of its attempts over time.
export async function logScore(
  pairingId: string,
  input: ScoreInput
): Promise<ActionResult> {
  const user = await requireUser();

  if (!input.taken_on) return { error: "Pick a date." };

  const raw = toNumber(input.raw_score);
  const max = toNumber(input.max_score);
  if (raw === null && max === null && !input.notes.trim()) {
    return { error: "Enter a score or a note." };
  }
  if (max !== null && max <= 0) return { error: "Max score must be positive." };

  const supabase = await createClient();
  const { error } = await supabase.from("practice_scores").insert({
    pairing_id: pairingId,
    taken_on: input.taken_on,
    raw_score: raw,
    max_score: max,
    placement: toNumber(input.placement),
    notes: input.notes.trim(),
    recorded_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/practice");
  return { ok: true };
}

export async function deleteScore(scoreId: string): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("practice_scores")
    .delete()
    .eq("id", scoreId);
  if (error) return { error: error.message };

  revalidatePath("/practice");
  return { ok: true };
}
