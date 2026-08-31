import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import PairingsBoard, {
  type DivisionData,
  type Member,
} from "./pairings-board";

export const metadata = { title: "Pairings — BCP SciOly" };

const DIVISION_META = {
  B: { name: "Division B", subtitle: "Middle School", colorVar: "--division-b" },
  C: { name: "Division C", subtitle: "High School", colorVar: "--division-c" },
} as const;

export default async function PairingsPage() {
  await requireUser();
  const supabase = await createClient();

  const [
    { data: teamRows },
    { data: eventRows },
    { data: memberRows },
    { data: pairingRows },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("id, division, name, code")
      .order("division")
      .order("code"),
    supabase.from("events").select("id, division, name").order("name"),
    supabase.from("team_members").select("team_id, students(id, full_name)"),
    supabase
      .from("pairings")
      .select("team_id, event_id, student1_id, student2_id"),
  ]);

  const membersByTeam = new Map<string, Member[]>();
  for (const row of memberRows ?? []) {
    const student = row.students as Member | null;
    if (!student) continue;
    const list = membersByTeam.get(row.team_id) ?? [];
    list.push(student);
    membersByTeam.set(row.team_id, list);
  }

  // team_id -> event_id -> [student1_id, student2_id | null]
  const pairingsByTeam = new Map<string, Map<string, [string, string | null]>>();
  for (const row of pairingRows ?? []) {
    const byEvent = pairingsByTeam.get(row.team_id) ?? new Map();
    byEvent.set(row.event_id, [row.student1_id, row.student2_id]);
    pairingsByTeam.set(row.team_id, byEvent);
  }

  const divisions: DivisionData[] = (["B", "C"] as const).map((code) => ({
    code,
    ...DIVISION_META[code],
    events: (eventRows ?? []).filter((e) => e.division === code),
    teams: (teamRows ?? [])
      .filter((t) => t.division === code)
      .map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        members: (membersByTeam.get(t.id) ?? []).sort((a, b) =>
          a.full_name.localeCompare(b.full_name)
        ),
        pairings: Object.fromEntries(pairingsByTeam.get(t.id) ?? []),
      })),
  }));

  return <PairingsBoard divisions={divisions} />;
}
