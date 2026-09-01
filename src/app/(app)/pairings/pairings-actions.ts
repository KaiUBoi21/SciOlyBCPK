"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { ok: true };

// Assign 0–3 partners to a team's event. An empty selection clears the pairing.
// Chosen students fill student1 / student2 / student3 in order.
export async function setPairing(
  teamId: string,
  eventId: string,
  studentIds: string[]
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const chosen = [...new Set(studentIds.filter(Boolean))];

  if (chosen.length === 0) {
    const { error } = await supabase
      .from("pairings")
      .delete()
      .eq("team_id", teamId)
      .eq("event_id", eventId);
    if (error) return { error: error.message };
    revalidatePath("/pairings");
    return { ok: true };
  }

  const { error } = await supabase.from("pairings").upsert(
    {
      team_id: teamId,
      event_id: eventId,
      student1_id: chosen[0],
      student2_id: chosen[1] ?? null,
      student3_id: chosen[2] ?? null,
    },
    { onConflict: "team_id,event_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/pairings");
  return { ok: true };
}
