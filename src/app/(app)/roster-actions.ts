"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";

export type ActionResult = { error: string } | { ok: true };

export async function createTeam(formData: FormData): Promise<ActionResult> {
  await requireUser();

  const division = String(formData.get("division") ?? "") as Enums<"division_code">;
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();

  if (division !== "B" && division !== "C") return { error: "Pick a division." };
  if (!name || !code) return { error: "Team name and code are required." };

  const supabase = await createClient();
  const { error } = await supabase.from("teams").insert({ division, name, code });
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function seatStudent(
  teamId: string,
  fullName: string
): Promise<ActionResult> {
  await requireUser();

  const name = fullName.trim();
  if (!name) return { error: "Enter a name." };

  const supabase = await createClient();

  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("division")
    .eq("id", teamId)
    .single();
  if (teamErr || !team) return { error: teamErr?.message ?? "Team not found." };

  const { data: student, error: studentErr } = await supabase
    .from("students")
    .insert({ full_name: name, division: team.division })
    .select("id")
    .single();
  if (studentErr || !student) {
    return { error: studentErr?.message ?? "Could not add student." };
  }

  const { error: linkErr } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, student_id: student.id });
  if (linkErr) return { error: linkErr.message };

  revalidatePath("/");
  return { ok: true };
}

export async function unseatStudent(
  teamId: string,
  studentId: string
): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("student_id", studentId);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

// Link an existing (unseated) student onto a team, without creating a new row.
export async function reseatStudent(
  teamId: string,
  studentId: string
): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, student_id: studentId });
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

// Permanently remove a student from the roster. Fails if they are still
// referenced by a pairing (FK is on delete restrict).
export async function removeStudent(studentId: string): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}
