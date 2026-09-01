"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";

export type ActionResult = { error: string } | { ok: true };

export type ResultInput = {
  event_id: string;
  team_id: string;
  placement: string;
  points: string;
  notes: string;
};

function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

// A competition is one meet on one date. Its results are the per-event,
// per-team placements/points entered afterward.
export async function createCompetition(
  formData: FormData
): Promise<ActionResult> {
  await requireUser();

  const division = String(
    formData.get("division") ?? ""
  ) as Enums<"division_code">;
  const name = String(formData.get("name") ?? "").trim();
  const heldOn = String(formData.get("held_on") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (division !== "B" && division !== "C") return { error: "Pick a division." };
  if (!name) return { error: "Competition name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("competitions").insert({
    division,
    name,
    held_on: heldOn || null,
    location,
  });
  if (error) return { error: error.message };

  revalidatePath("/competitions");
  return { ok: true };
}

// Record (or overwrite) one team's result for one event at a competition.
export async function logResult(
  competitionId: string,
  input: ResultInput
): Promise<ActionResult> {
  const user = await requireUser();

  if (!input.event_id || !input.team_id) {
    return { error: "Pick an event and a team." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("competition_scores").upsert(
    {
      competition_id: competitionId,
      event_id: input.event_id,
      team_id: input.team_id,
      placement: toNumber(input.placement),
      points: toNumber(input.points),
      notes: input.notes.trim(),
      recorded_by: user.id,
    },
    { onConflict: "competition_id,event_id,team_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/competitions");
  return { ok: true };
}

export async function deleteResult(scoreId: string): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("competition_scores")
    .delete()
    .eq("id", scoreId);
  if (error) return { error: error.message };

  revalidatePath("/competitions");
  return { ok: true };
}
