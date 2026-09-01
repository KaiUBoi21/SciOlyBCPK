import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import PracticeBoard, {
  type DivisionData,
  type PairingData,
  type Score,
} from "./practice-board";

export const metadata = { title: "Practice Scores — BCP SciOly" };

const DIVISION_META = {
  B: { name: "Division B", subtitle: "Middle School", colorVar: "--division-b" },
  C: { name: "Division C", subtitle: "High School", colorVar: "--division-c" },
} as const;

type PairingRow = {
  id: string;
  teams: { division: "B" | "C"; name: string; code: string } | null;
  events: { name: string } | null;
  student1: { full_name: string } | null;
  student2: { full_name: string } | null;
};

export default async function PracticePage() {
  await requireUser();
  const supabase = await createClient();

  const [{ data: pairingRows }, { data: scoreRows }] = await Promise.all([
    supabase.from("pairings").select(
      `id,
       teams ( division, name, code ),
       events ( name ),
       student1:students!pairings_student1_id_fkey ( full_name ),
       student2:students!pairings_student2_id_fkey ( full_name )`
    ),
    supabase
      .from("practice_scores")
      .select("id, pairing_id, taken_on, raw_score, max_score, placement, notes")
      .order("taken_on")
      .order("created_at"),
  ]);

  const scoresByPairing = new Map<string, Score[]>();
  for (const row of scoreRows ?? []) {
    const list = scoresByPairing.get(row.pairing_id) ?? [];
    list.push(row);
    scoresByPairing.set(row.pairing_id, list);
  }

  const pairings: PairingData[] = ((pairingRows ?? []) as PairingRow[])
    .filter((p) => p.teams && p.events)
    .map((p) => ({
      id: p.id,
      division: p.teams!.division,
      teamLabel: `${p.teams!.division}-${p.teams!.code}`,
      teamName: p.teams!.name,
      eventName: p.events!.name,
      partners: [p.student1?.full_name, p.student2?.full_name].filter(
        (n): n is string => Boolean(n)
      ),
      scores: scoresByPairing.get(p.id) ?? [],
    }))
    .sort(
      (a, b) =>
        a.teamLabel.localeCompare(b.teamLabel) ||
        a.eventName.localeCompare(b.eventName)
    );

  const divisions: DivisionData[] = (["B", "C"] as const).map((code) => ({
    code,
    ...DIVISION_META[code],
    pairings: pairings.filter((p) => p.division === code),
  }));

  return <PracticeBoard divisions={divisions} />;
}
