import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import RosterBoard, { type DivisionData, type Member } from "./roster-board";

const DIVISION_META = {
  B: {
    name: "Division B",
    subtitle: "Middle School",
    colorVar: "--division-b",
    tintVar: "--division-b-tint",
  },
  C: {
    name: "Division C",
    subtitle: "High School",
    colorVar: "--division-c",
    tintVar: "--division-c-tint",
  },
} as const;

export default async function HubHome() {
  await requireUser();
  const supabase = await createClient();

  const [{ data: teamRows }, { data: memberRows }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, division, name, code, capacity")
      .order("division")
      .order("code"),
    supabase.from("team_members").select("team_id, students(id, full_name)"),
  ]);

  const membersByTeam = new Map<string, Member[]>();
  for (const row of memberRows ?? []) {
    const student = row.students as Member | null;
    if (!student) continue;
    const list = membersByTeam.get(row.team_id) ?? [];
    list.push(student);
    membersByTeam.set(row.team_id, list);
  }

  const divisions: DivisionData[] = (["B", "C"] as const).map((code) => ({
    code,
    ...DIVISION_META[code],
    teams: (teamRows ?? [])
      .filter((t) => t.division === code)
      .map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        capacity: t.capacity,
        members: (membersByTeam.get(t.id) ?? []).sort((a, b) =>
          a.full_name.localeCompare(b.full_name)
        ),
      })),
  }));

  return <RosterBoard divisions={divisions} />;
}
